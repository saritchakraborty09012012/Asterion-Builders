import bpy, os, sys, math, random, time
from math import pi, radians, sin, cos
from mathutils import Vector

ROOT = r"D:\SARIT\NOVEXA- NoirDemons\cinematic flat website by deep seek"
sys.path.append(os.path.join(ROOT, 'blender'))
import build_interiors as bi
from build_interiors import cube, cyl, sphere, plane, plain, tex_mat, aim, camera, area_light, point_light, gradient_sky, build_room, reset, import_model, rug, OUT

# -----------------------------------------------------------------------------
# modern furniture
# -----------------------------------------------------------------------------
def sofa(name, x, y, rot=0, W=2.7, D=1.05, fabric=None, accent=None):
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(x, y, 0))
    root = bpy.context.object; root.name = name
    root.rotation_euler = (0, 0, rot)
    f = fabric; a = accent or fabric
    cube(name+'_base', (W, D, 0.26), (0, 0, 0.24), f, bevel=0.04, parent=root)
    cube(name+'_plinth', (W-0.35, D-0.4, 0.12), (0, 0, 0.07), plain('SofaPlinth', (0.09,0.08,0.06), 0.5), bevel=0.01, parent=root)
    for i,sx in enumerate((-1,1)):
        cube(name+f'_seat{i}', (W/2-0.16, D-0.32, 0.19), (sx*(W/4-0.04), 0.02, 0.45), f, bevel=0.075, parent=root)
        cube(name+f'_back{i}', (W/2-0.22, 0.17, 0.46), (sx*(W/4-0.04), D/2-0.25, 0.62), f,
             rot=(radians(-9),0,0), bevel=0.07, parent=root)
        cube(name+f'_pillow{i}', (0.48, 0.13, 0.42), (sx*(W/4-0.02), D/2-0.4, 0.66), a,
             rot=(radians(-14),0,radians(4 if i else -5)), bevel=0.09, parent=root)
    for sx in (-1,1):
        cube(name+f'_arm{sx}', (0.18, D, 0.42), (sx*(W/2-0.09), 0, 0.44), f, bevel=0.07, parent=root)
        cube(name+f'_armtop{sx}', (0.24, D-0.1, 0.09), (sx*(W/2-0.09), 0, 0.67), f, bevel=0.04, parent=root)
    # slim bronze feet
    for sx in (-1,1):
        for sy in (-1,1):
            cyl(name+f'_foot{sx}{sy}', 0.022, 0.08, (sx*(W/2-0.22), sy*(D/2-0.16), 0.04), plain('BronzeFoot',(0.18,0.12,0.06),0.3,0.9), vertices=12, parent=root)
    return root

def armchair(name, x, y, rot=0, fabric=None, accent=None):
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(x, y, 0))
    root = bpy.context.object; root.name = name
    root.rotation_euler = (0,0,rot)
    f = fabric; a = accent or fabric
    cube(name+'_base', (0.92, 0.9, 0.24), (0, 0, 0.24), f, bevel=0.05, parent=root)
    cube(name+'_seat', (0.74, 0.72, 0.17), (0, 0.02, 0.43), f, bevel=0.07, parent=root)
    # curved back: three boxes fanned
    cube(name+'_back', (0.92, 0.18, 0.58), (0, 0.38, 0.55), f, rot=(radians(-8),0,0), bevel=0.09, parent=root)
    for sx in (-1,1):
        cube(name+f'_arm{sx}', (0.13, 0.86, 0.34), (sx*0.44, 0.03, 0.42), f, bevel=0.06, parent=root)
        cube(name+f'_armtop{sx}', (0.17, 0.76, 0.08), (sx*0.44, 0.0, 0.59), f, bevel=0.035, parent=root)
    cube(name+'_pillow', (0.44, 0.13, 0.38), (0, 0.25, 0.6), a, rot=(radians(-13),0,0), bevel=0.09, parent=root)
    for sx in (-1,1):
        for sy in (-1,1):
            cyl(name+f'_foot{sx}{sy}', 0.02, 0.09, (sx*0.34, sy*0.34, 0.045), plain('BronzeFoot',(0.18,0.12,0.06),0.3,0.9), vertices=12, parent=root)
    return root

def round_table(name, x, y, r=0.6, h=0.36, mat=None, base_mat=None):
    cyl(name+'_top', r, 0.055, (x, y, h), mat, vertices=64)
    cyl(name+'_base', r*0.52, h-0.055, (x, y, (h-0.055)/2), base_mat or mat, vertices=48)
    cyl(name+'_foot', r*0.62, 0.025, (x, y, 0.0125), base_mat or mat, vertices=48)

def sculptural_table(name, x, y):
    # travertine coffee table: two stacked organic cylinders
    cyl(name+'_top', 0.62, 0.07, (x, y, 0.34), plain('TravTop',(0.77,0.68,0.54),0.55), vertices=64)
    cyl(name+'_mid', 0.42, 0.26, (x, y, 0.18), plain('TravBase',(0.65,0.56,0.43),0.6), vertices=48)
    cyl(name+'_foot', 0.5, 0.045, (x, y, 0.025), plain('TravFoot',(0.42,0.35,0.26),0.65), vertices=48)

def linear_pendant(x, y, z, length=2.2, warm=None):
    cube('PendantBar', (0.045, length, 0.045), (x, y, z), plain('PendantBrass',(0.35,0.24,0.11),0.3,0.9))
    for i,t in enumerate((-0.36,0,0.36)):
        px = x
        py = y + t*length
        cyl(f'PendCord{i}', 0.006, 0.35, (px, py, z-0.18), plain('PendCord',(0.05,0.05,0.05),0.5), vertices=8)
        sphere(f'PendGlobe{i}', 0.085, (px, py, z-0.4), plain('Opal',(1,0.93,0.8),0.2, emission=(1,0.75,0.45), estr=6))
        point_light(f'PendLight{i}', (px, py, z-0.42), 28, (1,0.7,0.42), 0.15)

def dining_set(x, y, fabric=None, leg=None, top_mat=None):
    fabric = fabric or plain('ChairFabric',(0.42,0.34,0.24),0.8)
    leg = leg or plain('BronzeLeg',(0.18,0.12,0.06),0.3,0.9)
    top_mat = top_mat or plain('DiningOak',(0.35,0.24,0.14),0.45)
    # oval top
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.25, depth=0.07, location=(x,y,0.755))
    top = bpy.context.object; top.scale=(1.0,0.46,1.0); top.name='DiningTop'
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    top.data.materials.append(top_mat)
    for p in top.data.polygons: p.use_smooth=True
    for sx in (-0.85, 0.85):
        cyl('DiningLeg', 0.055, 0.72, (x+sx, y, 0.36), leg, vertices=24)
    cube('DiningBeam', (1.6, 0.06, 0.06), (x, y, 0.12), leg)
    # chairs
    chair_positions = [(-0.65,0.95,pi), (0.35,0.95,pi), (-0.65,-0.95,0), (0.35,-0.95,0), (1.35,0,radians(90)), (-1.35,0,radians(-90))]
    for i,(cx,cy,rz) in enumerate(chair_positions):
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=(x+cx, y+cy, 0))
        ch = bpy.context.object; ch.name=f'Chair{i}'; ch.rotation_euler=(0,0,rz)
        cube(f'ChSeat{i}', (0.48,0.46,0.07), (0,0,0.46), fabric, bevel=0.035, parent=ch)
        cube(f'ChBack{i}', (0.48,0.06,0.5), (0,0.22,0.7), fabric, rot=(radians(-6),0,0), bevel=0.03, parent=ch)
        for lx in (-0.19,0.19):
            for ly in (-0.19,0.19):
                cyl(f'ChLeg{i}', 0.015, 0.44, (lx,ly,0.22), leg, vertices=12, parent=ch)

def olive_tree(name, x, y, height=2.2, pot_r=0.38):
    pot = plain('Pot', (0.32,0.27,0.21), 0.75)
    cyl(name+'_pot', pot_r, 0.5, (x,y,0.25), pot, vertices=40)
    trunk = plain('OliveTrunk', (0.2,0.15,0.1), 0.9)
    cyl(name+'_trunk', 0.045, height*0.6, (x,y,0.5+height*0.3), trunk, vertices=12)
    rnd = random.Random(hash(name) % 1000)
    leaf = plain('OliveLeaf', (0.24,0.28,0.16), 0.75)
    for b in range(5):
        a = rnd.uniform(0,2*pi)
        bx = x + cos(a)*0.35; by = y + sin(a)*0.35
        cyl(name+f'_br{b}', 0.022, 0.7, (bx, by, 0.5+height*0.65), trunk, vertices=8, rot=(rnd.uniform(-0.4,0.4), rnd.uniform(-0.4,0.4), 0))
        for c in range(6):
            cx2 = bx + rnd.uniform(-0.35,0.35); cy2 = by + rnd.uniform(-0.35,0.35); cz = 0.5+height*0.8 + rnd.uniform(-0.25,0.35)
            sphere(name+f'_lf{b}_{c}', rnd.uniform(0.15,0.26), (cx2, cy2, cz), leaf, seg=12, ring=8)

def curtain_panels(x, y, z, height, panel_w=0.55, mat=None):
    for i in range(3):
        for sx in (-1,1):
            cube(f'Curtain{i}{sx}', (panel_w, 0.05, height), (x + sx*(2.9 + i*0.18), y + (0.12 if i%2 else -0.04), z), mat, bevel=0.012)

def city_view(y, height_base=0.0):
    # distant hazy skyline behind the window
    rnd = random.Random(11)
    mat = plain('FarCity', (0.25,0.3,0.32), 0.9)
    win = plain('FarWin',(1,0.75,0.45),0.4, emission=(1,0.6,0.28), estr=3)
    for i in range(26):
        x = rnd.uniform(-26, 26)
        h = rnd.uniform(2.5, 15)
        w = rnd.uniform(0.8, 2.6)
        cube(f'FarTower{i}', (w, 0.8, h), (x, y + rnd.uniform(-2,2), height_base + h/2), mat)
        if rnd.random() < 0.6:
            for j in range(int(h*0.5)):
                if rnd.random() < 0.25:
                    cube(f'FarWin{i}_{j}', (w*0.5, 0.02, 0.08), (x, y-0.42, height_base + 0.6 + j*1.5), win)

def finish(sc, name, res=(700,900), samples=12, exposure=0.2):
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.eevee.taa_render_samples = samples
    sc.view_settings.exposure = exposure
    sc.render.filepath = os.path.join(OUT, name + '.jpg')
    t = time.time(); bpy.ops.render.render(write_still=True); print('RENDERED', name, round(time.time()-t,1))

def proc_mat(name, base, rough=0.8, kind='plaster', color2=None, bump=0.2, metal=0.0, emis=None, estr=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree; ns = nt.nodes; ls = nt.links
    bsdf = ns.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*base, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if emis:
        bsdf.inputs['Emission Color'].default_value = (*emis, 1)
        bsdf.inputs['Emission Strength'].default_value = estr
    tc = ns.new('ShaderNodeTexCoord')
    mp = ns.new('ShaderNodeMapping')
    ls.new(tc.outputs['Object'], mp.inputs['Vector'])
    c2 = color2 or tuple(max(0, c*0.72) for c in base)
    if kind == 'wood':
        w = ns.new('ShaderNodeTexWave')
        w.wave_type = 'BANDS'; w.bands_direction = 'X'; w.inputs['Scale'].default_value = 2.2
        w.inputs['Distortion'].default_value = 0.9; w.inputs['Detail'].default_value = 2.0
        w.inputs['Detail Scale'].default_value = 1.2
        ls.new(mp.outputs['Vector'], w.inputs['Vector'])
        ramp = ns.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color = (*c2, 1)
        ramp.color_ramp.elements[1].color = (*base, 1)
        ramp.color_ramp.elements[0].position = 0.25
        ramp.color_ramp.elements[1].position = 0.8
        ls.new(w.outputs['Fac'], ramp.inputs['Fac'])
        ls.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
        b = ns.new('ShaderNodeBump'); b.inputs['Strength'].default_value = 0.08; b.inputs['Distance'].default_value = 0.01
        ls.new(w.outputs['Fac'], b.inputs['Height']); ls.new(b.outputs['Normal'], bsdf.inputs['Normal'])
    elif kind in ('stone', 'travertine'):
        n = ns.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value = 4.0; n.inputs['Detail'].default_value = 8.0; n.inputs['Roughness'].default_value = 0.62
        ls.new(mp.outputs['Vector'], n.inputs['Vector'])
        ramp = ns.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color = (*c2, 1)
        ramp.color_ramp.elements[1].color = (*base, 1)
        ramp.color_ramp.elements[0].position = 0.3
        ramp.color_ramp.elements[1].position = 0.75
        ls.new(n.outputs['Fac'], ramp.inputs['Fac'])
        ls.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
        b = ns.new('ShaderNodeBump'); b.inputs['Strength'].default_value = bump; b.inputs['Distance'].default_value = 0.03
        ls.new(n.outputs['Fac'], b.inputs['Height']); ls.new(b.outputs['Normal'], bsdf.inputs['Normal'])
    elif kind in ('fabric', 'boucle'):
        n = ns.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value = 160.0; n.inputs['Detail'].default_value = 3.0; n.inputs['Roughness'].default_value = 0.5
        ls.new(mp.outputs['Vector'], n.inputs['Vector'])
        b = ns.new('ShaderNodeBump'); b.inputs['Strength'].default_value = bump; b.inputs['Distance'].default_value = 0.012
        ls.new(n.outputs['Fac'], b.inputs['Height']); ls.new(b.outputs['Normal'], bsdf.inputs['Normal'])
        n2 = ns.new('ShaderNodeTexNoise')
        n2.inputs['Scale'].default_value = 4.0; n2.inputs['Detail'].default_value = 2.0
        ls.new(mp.outputs['Vector'], n2.inputs['Vector'])
        ramp = ns.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color = (*c2, 1)
        ramp.color_ramp.elements[1].color = (*base, 1)
        ls.new(n2.outputs['Fac'], ramp.inputs['Fac'])
        ls.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    else:
        n = ns.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value = 28.0; n.inputs['Detail'].default_value = 5.0; n.inputs['Roughness'].default_value = 0.55
        ls.new(mp.outputs['Vector'], n.inputs['Vector'])
        b = ns.new('ShaderNodeBump'); b.inputs['Strength'].default_value = bump; b.inputs['Distance'].default_value = 0.02
        ls.new(n.outputs['Fac'], b.inputs['Height']); ls.new(b.outputs['Normal'], bsdf.inputs['Normal'])
    return mat

def distant_skyline(y, spread=300, count=34, zbase=-18.0):
    haze = proc_mat('DistantCity', (0.17,0.19,0.22), 0.95, 'plaster', bump=0.0, emis=(0.34,0.32,0.30), estr=0.35)
    win = proc_mat('DistantWin', (0.9,0.7,0.45), 0.5, 'plaster', bump=0.0, emis=(1,0.63,0.3), estr=1.0)
    rnd = random.Random(21)
    for i in range(count):
        x = rnd.uniform(-spread, spread)
        h = rnd.uniform(9, 34) * (1.5 if abs(x) < 55 else 1.0)
        w = rnd.uniform(6, 22)
        d = rnd.uniform(6, 18)
        ty = y + rnd.uniform(-60,60)
        cube(f'CityT{i}', (w, d, h), (x, ty, zbase + h/2), haze)
        if rnd.random() < 0.4:
            for j in range(int(h/6)):
                if rnd.random() < 0.4:
                    cube(f'CityW{i}_{j}', (w*0.16, 0.5, 0.5), (x, ty - d/2 - 0.3, zbase + 3.0 + j*6.0), win)

def city_floor(z=-18.0):
    mat = proc_mat('HazeGround', (0.28,0.24,0.21), 1.0, 'plaster', bump=0.0, emis=(0.52,0.42,0.34), estr=0.28)
    plane('HazeGround', (6000, 6000, 1), (0, 900, z), mat)
    warm = plain('HazeLight', (1,0.75,0.45), 0.4, emission=(1,0.64,0.32), estr=2.0)
    rnd = random.Random(77)
    for i in range(150):
        x = rnd.uniform(-800, 800)
        y = rnd.uniform(180, 900)
        cube(f'HazeDot{i}', (rnd.uniform(0.8,2.4), rnd.uniform(0.8,2.4), 0.8), (x, y, z+0.5), warm)

def dusk_sky_mat(name='DuskSky'):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree; ns = nt.nodes; ls = nt.links
    ns.clear()
    out = ns.new('ShaderNodeOutputMaterial')
    em = ns.new('ShaderNodeEmission')
    tc = ns.new('ShaderNodeTexCoord')
    sep = ns.new('ShaderNodeSeparateXYZ')
    ramp = ns.new('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0;  cr.elements[0].color = (0.92,0.55,0.28,1)
    cr.elements[1].position = 0.055; cr.elements[1].color = (1.0,0.76,0.48,1)
    e = cr.elements.new(0.16); e.color = (0.62,0.58,0.58,1)
    e = cr.elements.new(0.45); e.color = (0.28,0.38,0.54,1)
    e = cr.elements.new(0.9);  e.color = (0.10,0.17,0.30,1)
    ls.new(tc.outputs['Generated'], sep.inputs['Vector'])
    ls.new(sep.outputs['Y'], ramp.inputs['Fac'])
    ls.new(ramp.outputs['Color'], em.inputs['Color'])
    em.inputs['Strength'].default_value = 1.0
    ls.new(em.outputs['Emission'], out.inputs['Surface'])
    return mat

def sky_backdrop(y, width=1600, height=300):
    plane('SkyBackdrop', (width, height, 1), (0, y, height/2 - 3), dusk_sky_mat(), rot=(radians(90),0,0))

def wood_floor_mat(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree; ns = nt.nodes; ls = nt.links
    b = ns.get('Principled BSDF')
    tc = ns.new('ShaderNodeTexCoord'); mp = ns.new('ShaderNodeMapping')
    ls.new(tc.outputs['Object'], mp.inputs['Vector'])
    brick = ns.new('ShaderNodeTexBrick')
    brick.offset = 0.4
    brick.inputs['Scale'].default_value = 1.0
    brick.inputs['Mortar Size'].default_value = 0.0025
    brick.inputs['Color1'].default_value = (0.155, 0.10, 0.062, 1)
    brick.inputs['Color2'].default_value = (0.115, 0.072, 0.044, 1)
    brick.inputs['Mortar'].default_value = (0.06, 0.038, 0.024, 1)
    # long narrow planks
    brick.inputs['Brick Width'].default_value = 1.1
    brick.inputs['Row Height'].default_value = 0.19
    wave = ns.new('ShaderNodeTexWave')
    wave.inputs['Scale'].default_value = 26; wave.inputs['Distortion'].default_value = 1.6; wave.inputs['Detail'].default_value = 3
    wave.bands_direction = 'X'
    ls.new(mp.outputs['Vector'], wave.inputs['Vector'])
    mixer = ns.new('ShaderNodeMixRGB'); mixer.blend_type='MULTIPLY'; mixer.inputs['Fac'].default_value=0.16
    ls.new(brick.outputs['Color'], mixer.inputs['Color1'])
    ls.new(wave.outputs['Color'], mixer.inputs['Color2'])
    ls.new(mixer.outputs['Color'], b.inputs['Base Color'])
    bump = ns.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=0.12; bump.inputs['Distance'].default_value=0.02
    ls.new(brick.outputs['Fac'], bump.inputs['Height'])
    ls.new(bump.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = 0.38
    return mat

def wood_mat(name, base, dark, rough=0.42, grain_axis='X'):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree; ns = nt.nodes; ls = nt.links
    b = ns.get('Principled BSDF')
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = 0.0
    tc = ns.new('ShaderNodeTexCoord'); mp = ns.new('ShaderNodeMapping')
    if grain_axis == 'X':
        mp.inputs['Scale'].default_value = (0.35, 8.0, 8.0)
    else:
        mp.inputs['Scale'].default_value = (8.0, 0.35, 8.0)
    ls.new(tc.outputs['Object'], mp.inputs['Vector'])
    n = ns.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = 2.6; n.inputs['Detail'].default_value = 6.0
    n.inputs['Roughness'].default_value = 0.58; n.inputs['Distortion'].default_value = 0.4
    ls.new(mp.outputs['Vector'], n.inputs['Vector'])
    ramp = ns.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.3
    ramp.color_ramp.elements[0].color = (*dark, 1)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (*base, 1)
    ls.new(n.outputs['Fac'], ramp.inputs['Fac'])
    ls.new(ramp.outputs['Color'], b.inputs['Base Color'])
    bump = ns.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.05; bump.inputs['Distance'].default_value = 0.008
    ls.new(n.outputs['Fac'], bump.inputs['Height'])
    ls.new(bump.outputs['Normal'], b.inputs['Normal'])
    return mat

# =============================================================================
# living
# =============================================================================
def living(preview=True):
    sc = reset()
    plaster = proc_mat('Plaster', (0.55,0.47,0.36), 0.92, 'plaster', bump=0.07)
    ceiling = proc_mat('CeilingPlaster', (0.62,0.55,0.44), 0.95, 'plaster', bump=0.03)
    oak = wood_floor_mat('OakFloor')
    linen = proc_mat('Linen', (0.58,0.51,0.4), 0.95, 'fabric', color2=(0.48,0.41,0.31), bump=0.3)
    boucle = proc_mat('Boucle', (0.66,0.59,0.47), 0.98, 'boucle', color2=(0.56,0.49,0.38), bump=0.5)
    boucle2 = proc_mat('BoucleClay', (0.33,0.2,0.11), 0.95, 'boucle', color2=(0.24,0.14,0.07), bump=0.45)
    travertine = proc_mat('Travertine', (0.62,0.53,0.4), 0.55, 'travertine', color2=(0.45,0.37,0.27), bump=0.2)
    bi.glass_mat = plain('Glass', (0.3,0.4,0.42), 0.05, 0.1)
    bi.glass_mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.06
    bi.glass_mat.blend_method='BLEND'
    bronze = plain('Bronze', (0.22,0.15,0.08), 0.28, 0.9)
    black = plain('BlackMetal', (0.04,0.04,0.035), 0.4, 0.6)
    warm = plain('Warm', (1,0.8,0.55), 0.5, emission=(1,0.62,0.32), estr=4)
    dark = plain('DarkOak', (0.12,0.085,0.055), 0.55)
    stone = plain('StoneTop', (0.78,0.71,0.6), 0.55)

    W, D, H = 10.4, 10.0, 3.4
    build_room(sc, W, D, H, oak, plaster, ceiling, back_open=(0.4, 6.6, 0.18, 3.3))
    # window frame (no glass so sunlight enters)
    wy = D/2 - 0.06; wx = 0.4; ww = 6.6; z0 = 0.18; z1 = 3.3
    cube('WinFrameT', (ww+0.14, 0.18, 0.1), (wx, wy, z1), bronze)
    cube('WinFrameB', (ww+0.14, 0.18, 0.12), (wx, wy, z0), bronze)
    cube('WinFrameL', (0.1, 0.18, z1-z0), (wx-ww/2, wy, (z0+z1)/2), bronze)
    cube('WinFrameR', (0.1, 0.18, z1-z0), (wx+ww/2, wy, (z0+z1)/2), bronze)
    for i in range(1,4):
        cube(f'WinMull{i}', (0.045, 0.14, z1-z0), (wx-ww/2+i*ww/4, wy, (z0+z1)/2), bronze)
    # sheer curtains
    curtain_panels(wx, wy-0.12, (z0+z1)/2, z1-z0+0.1, 0.5, linen)
    # view: hazy horizon and a distant skyline
    sky_backdrop(D/2+420, 1400, 300)
    distant_skyline(D/2+360)

    rug('Rug', 5.4, 4.0, (0.6, 1.05), linen)
    sofa('Sofa', 1.1, 2.3, rot=0, fabric=boucle, accent=boucle2)
    sculptural_table('Coffee', 0.8, 0.7)
    armchair('ChairL', -1.55, 1.35, rot=radians(55), fabric=boucle, accent=boucle2)
    # side table + sculptural lamp
    round_table('SideL', -0.5, 2.55, r=0.28, h=0.5, mat=travertine, base_mat=bronze)
    cyl('LampStem', 0.018, 0.45, (-0.5,2.55,0.95), bronze, vertices=12)
    sphere('LampGlobe', 0.15, (-0.5,2.55,1.22), plain('Opal',(1,0.94,0.82),0.2, emission=(1,0.74,0.45), estr=7))
    point_light('SideLampLight', (-0.5,2.55,1.2), 22, (1,0.68,0.4), 0.2)
    # coffee table objects
    cyl('Bowl', 0.16, 0.07, (0.55, 0.55, 0.4), proc_mat('BowlMat', (0.22,0.15,0.1), 0.5, 'stone', color2=(0.12,0.08,0.05), bump=0.1), vertices=32)
    cyl('Vase', 0.07, 0.32, (1.15, 0.6, 0.53), bronze, vertices=24)
    for i in range(5):
        a = i*1.3
        cyl(f'Stem{i}', 0.005, 0.65, (1.15 + math.cos(a)*0.1, 0.6 + math.sin(a)*0.1, 0.95), plain('StemMat',(0.18,0.2,0.1),0.7), vertices=6, rot=(math.cos(a)*0.2, math.sin(a)*0.2, 0))
        sphere(f'StemLeaf{i}', 0.05, (1.15 + math.cos(a)*0.22, 0.6 + math.sin(a)*0.22, 1.15 + i*0.05), plain('StemLeaf',(0.25,0.28,0.14),0.7), seg=10, ring=8)
    # console + art on left wall
    cube('Console', (0.42, 1.8, 0.05), (-W/2+0.38, 0.3, 0.8), travertine, bevel=0.015)
    for sy in (-0.72, 0.72):
        cube('ConsoleLeg', (0.34, 0.04, 0.78), (-W/2+0.38, 0.3+sy, 0.4), bronze)
    cube('ArtFrame', (0.06, 1.7, 2.1), (-W/2+0.12, 0.25, 1.95), bronze)
    cube('ArtCanvas', (0.07, 1.55, 1.95), (-W/2+0.17, 0.25, 1.95), proc_mat('ArtCanvasMat', (0.4,0.33,0.24), 0.95, 'plaster', bump=0.3))
    cube('ArtBand', (0.08, 0.5, 1.95), (-W/2+0.18, 0.62, 1.95), proc_mat('ArtBandMat', (0.2,0.15,0.1), 0.95, 'plaster', bump=0.2))
    # olive trees + plant
    import_model('potted_plant_01', (3.95, 2.5, 0), rot_z=radians(-24), scale=1.7)
    import_model('potted_plant_01', (-3.9, 3.0, 0), rot_z=radians(18), scale=1.35)
    # linear pendant
    linear_pendant(0.8, 1.0, 2.7, 2.0, warm)
    # ceiling recess
    cube('CeilingShadow', (6.0, 0.06, 0.12), (0.5, -2.2, H-0.06), black)
    cube('CoveGlow', (8.0, 0.05, 0.06), (0.4, 2.0, H-0.12), plain('CoveLight',(1,0.86,0.62),0.5, emission=(1,0.8,0.52), estr=1.3))

    # sun + fills
    sun = bpy.data.lights.new('Sun','SUN'); sun.energy=4.0; sun.color=(1.0,0.67,0.4); sun.angle=radians(1.5)
    so = bpy.data.objects.new('Sun', sun); sc.collection.objects.link(so); so.location=(10, 25, 13)
    aim(so, (-2.5, 0, 0.4))
    area_light('SkyFill', (0.4, 4.0, 2.2), (0.4, 0, 1.2), 320, (0.9,0.92,1.0), 5.0, 'RECTANGLE', 3.0)
    area_light('InteriorFill', (-3.0, -2.5, 2.9), (0.6, 1.5, 1.0), 110, (0.9,0.82,0.7), 3.0)
    area_light('GoldBounce', (4.2, 3.6, 2.0), (0.5, 2.0, 0.8), 110, (1.0,0.65,0.4), 2.0)

    camera((-1.85, -4.1, 1.5), (0.8, 2.1, 1.45), 34)
    finish(sc, 'interior_living_preview' if preview else 'interior_living',
           (700,900) if preview else (1150,1450), 14 if preview else 48, 0.15)

# =============================================================================
# dining / kitchen
# =============================================================================
def pendant_globes(prefix, xs, y, z, light=18, r=0.10, ceil=3.35):
    for i, x in enumerate(xs):
        top = ceil
        bottom = z - 0.24
        cyl(f'{prefix}Cord{i}', 0.006, top - bottom, (x, y, (top + bottom)/2), plain('PendCordM',(0.04,0.04,0.04),0.5), vertices=8)
        cyl(f'{prefix}Cap{i}', 0.035, 0.045, (x, y, z - 0.24), plain('PendBrass',(0.4,0.26,0.1),0.25,0.95), vertices=20)
        sphere(f'{prefix}Globe{i}', r, (x, y, z - 0.35), plain('PendOpal',(1,0.93,0.8),0.15, emission=(1,0.72,0.42), estr=7), seg=24, ring=16)
        point_light(f'{prefix}Light{i}', (x, y, z - 0.36), light, (1,0.7,0.42), 0.2)

def ceiling_spots(xs, ys, z):
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            cyl(f'SpotRim{i}{j}', 0.055, 0.02, (x, y, z - 0.01), plain('SpotTrim',(0.15,0.13,0.1),0.5,0.5), vertices=16)
            cyl(f'SpotGlow{i}{j}', 0.038, 0.012, (x, y, z - 0.022), plain('SpotGlowM',(1,0.85,0.6),0.4, emission=(1,0.72,0.42), estr=5), vertices=16)

def wall_art(name, w, h, loc, rot, canvas_mat, frame_mat, band_mat=None):
    cube(name+'Frame', (w+0.1, 0.05, h+0.1), loc, frame_mat, rot=rot, bevel=0.006)
    cube(name+'Canvas', (w, 0.06, h), (loc[0], loc[1]-0.01, loc[2]), canvas_mat, rot=rot)
    if band_mat:
        cube(name+'Band', (w*0.34, 0.07, h), (loc[0], loc[1]-0.02, loc[2]), band_mat, rot=rot)

def dining(preview=True):
    sc = reset()
    plaster = proc_mat('Plaster', (0.60,0.53,0.42), 0.94, 'plaster', bump=0.035)
    ceiling = proc_mat('CeilingPlaster', (0.65,0.58,0.47), 0.96, 'plaster', bump=0.02)
    floor = wood_floor_mat('OakFloor')
    oak = wood_mat('OakCabinet', (0.33,0.195,0.095), (0.15,0.085,0.04), 0.36)
    marble = proc_mat('CreamMarble', (0.76,0.70,0.59), 0.26, 'stone', color2=(0.60,0.52,0.41), bump=0.04)
    linen = proc_mat('Linen', (0.62,0.55,0.44), 0.96, 'fabric', color2=(0.53,0.46,0.36), bump=0.28)
    woven = proc_mat('DiningChair', (0.62,0.56,0.45), 0.97, 'boucle', color2=(0.53,0.47,0.37), bump=0.4)
    travertine = proc_mat('Travertine', (0.62,0.53,0.40), 0.55, 'travertine', color2=(0.46,0.38,0.28), bump=0.15)
    bronze = plain('Bronze', (0.24,0.16,0.08), 0.26, 0.92)
    black = plain('BlackMetal', (0.04,0.04,0.035), 0.4, 0.6)
    opal = plain('Opal',(1,0.94,0.82),0.18, emission=(1,0.75,0.45), estr=6)
    bi.glass_mat = plain('Glass', (0.3,0.4,0.42), 0.05, 0.1)
    bi.glass_mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.05
    bi.glass_mat.blend_method = 'BLEND'

    W, D, H = 11.0, 10.0, 3.35
    build_room(sc, W, D, H, floor, plaster, ceiling, back_open=(1.1, 6.6, 0.18, 3.28))

    # ---- glazing: thin bronze mullions, no glass so dusk light enters
    wy = D/2 - 0.06; wx = 1.1; ww = 6.6; z0 = 0.18; z1 = 3.28
    cube('WinFrameT', (ww+0.12, 0.16, 0.09), (wx, wy, z1), bronze)
    cube('WinFrameB', (ww+0.12, 0.16, 0.10), (wx, wy, z0), bronze)
    for sx in (-1, 1):
        cube('WinFrameS', (0.09, 0.16, z1-z0), (wx+sx*ww/2, wy, (z0+z1)/2), bronze)
    for i in range(1, 4):
        cube(f'WinMull{i}', (0.04, 0.12, z1-z0), (wx-ww/2+i*ww/4, wy, (z0+z1)/2), bronze)
    curtain_panels(wx, wy-0.16, (z0+z1)/2, z1-z0+0.08, 0.44, linen)

    # ---- view
    city_floor()
    sky_backdrop(D/2+620)
    distant_skyline(D/2+560)

    # ---- kitchen wall, left
    kx = -3.55
    cube('CabinetBody', (3.15, 0.58, 2.75), (kx, D/2-0.33, 1.375), oak, bevel=0.006)
    for i in range(3):
        cube(f'CabinetDoor{i}', (0.99, 0.035, 2.62), (kx-1.03+i*1.03, D/2-0.64, 1.35), oak, bevel=0.005)
        cube(f'CabinetPull{i}', (0.42, 0.02, 0.022), (kx-1.03+i*1.03, D/2-0.67, 1.72), bronze)
        cube(f'CabinetGap{i}', (0.012, 0.04, 2.6), (kx-1.53+i*1.03, D/2-0.66, 1.35), black)
    cube('Counter', (3.3, 0.72, 0.075), (kx, D/2-0.36, 0.985), marble, bevel=0.01)
    cube('Splashback', (3.3, 0.06, 0.82), (kx, D/2-0.69, 1.42), marble)
    cube('Shelf', (2.5, 0.30, 0.055), (kx+0.1, D/2-0.55, 2.28), oak)
    cube('ShelfGlow', (2.46, 0.05, 0.02), (kx+0.1, D/2-0.42, 2.24), opal)
    cyl('ShelfVase', 0.09, 0.26, (kx-0.75, D/2-0.52, 2.44), travertine, vertices=24)
    cyl('ShelfJar', 0.07, 0.16, (kx+0.55, D/2-0.52, 2.39), plain('Jar',(0.3,0.2,0.12),0.5), vertices=20)
    # espresso / cooktop detailing
    cube('Cooktop', (0.82, 0.5, 0.015), (kx+0.4, D/2-0.36, 1.03), black, bevel=0.005)
    cyl('Faucet', 0.018, 0.36, (kx-0.85, D/2-0.55, 1.2), bronze, vertices=12)
    cyl('FaucetArm', 0.014, 0.26, (kx-0.73, D/2-0.55, 1.37), bronze, vertices=12, rot=(0,radians(90),0))

    # tall pantry at far left
    cube('Pantry', (0.9, 0.62, 2.9), (-5.02, D/2-0.35, 1.45), oak, bevel=0.006)
    cube('PantryGap', (0.012, 0.04, 2.86), (-5.02, D/2-0.67, 1.45), black)

    # ---- island
    cube('IslandBase', (3.5, 1.3, 0.84), (-2.65, 1.15, 0.42), oak, bevel=0.012)
    cube('IslandTop', (3.82, 1.62, 0.085), (-2.65, 1.15, 0.895), marble, bevel=0.012)
    cube('IslandWaterfallL', (0.085, 1.62, 0.86), (-4.52, 1.15, 0.43), marble, bevel=0.006)
    cube('IslandWaterfallR', (0.085, 1.62, 0.86), (-0.78, 1.15, 0.43), marble, bevel=0.006)
    # island props
    cyl('IslandBowl', 0.23, 0.08, (-3.1, 1.0, 0.975), travertine, vertices=40)
    cube('IslandBoard', (0.55, 0.34, 0.028), (-1.9, 1.05, 0.95), oak, bevel=0.006)
    cyl('IslandVase', 0.075, 0.32, (-3.7, 1.42, 1.09), plain('DarkVase',(0.18,0.12,0.08),0.4), vertices=24)
    for i in range(5):
        a = i*1.26
        cyl(f'OliveStem{i}', 0.004, 0.55, (-3.7+math.cos(a)*0.07, 1.42+math.sin(a)*0.07, 1.5), plain('Stem',(0.2,0.22,0.11),0.7), vertices=6, rot=(math.cos(a)*0.18, math.sin(a)*0.18, 0))
        sphere(f'OliveLeaf{i}', 0.045, (-3.7+math.cos(a)*0.2, 1.42+math.sin(a)*0.2, 1.66+i*0.045), plain('Leaf',(0.26,0.29,0.15),0.7), seg=10, ring=8)
    # stools
    for i in range(3):
        sx = -3.55 + i*0.9
        cyl(f'StoolSeat{i}', 0.20, 0.065, (sx, -0.12, 0.63), woven, vertices=32)
        cyl(f'StoolStem{i}', 0.022, 0.56, (sx, -0.12, 0.31), bronze, vertices=12)
        cyl(f'StoolBase{i}', 0.15, 0.02, (sx, -0.12, 0.015), bronze, vertices=24)
    # two globes over the island
    pendant_globes('Isle', [-3.25, -2.05], 1.05, 2.30, light=14, r=0.085)

    # ---- dining
    dining_set(3.15, 0.55, fabric=woven, leg=bronze, top_mat=travertine)
    rug('DiningRug', 5.0, 3.5, (3.15, 0.55), linen)
    pendant_globes('Dine', [2.35, 3.15, 3.95], 0.55, 2.42, light=16, r=0.105)
    # centrepiece
    cyl('DineVase', 0.13, 0.08, (3.15, 0.4, 0.93), travertine, vertices=32)
    for i in range(2):
        a = i*2.4
        cyl(f'DineStem{i}', 0.004, 0.4, (3.15+math.cos(a)*0.05, 0.4+math.sin(a)*0.05, 1.16), plain('Stem',(0.2,0.22,0.11),0.7), vertices=6, rot=(math.cos(a)*0.22, math.sin(a)*0.22, 0))
        sphere(f'DineBud{i}', 0.02, (3.15+math.cos(a)*0.14, 0.4+math.sin(a)*0.14, 1.34), plain('Bud',(0.5,0.38,0.2),0.7), seg=8, ring=6)

    # ---- right wall: sideboard + art
    cube('Sideboard', (0.42, 2.3, 0.72), (W/2-0.28, 0.9, 0.36), oak, bevel=0.01)
    cube('SideboardTop', (0.46, 2.38, 0.05), (W/2-0.28, 0.9, 0.745), marble, bevel=0.008)
    cube('SideboardLeg', (0.3, 2.2, 0.06), (W/2-0.28, 0.9, 0.03), black)
    # art on the right return wall, facing -X
    cube('DiningArtFrame', (0.05, 1.18, 1.62), (W/2-0.10, 0.85, 1.95), bronze)
    cube('DiningArtCanvas', (0.06, 1.06, 1.5), (W/2-0.13, 0.85, 1.95),
         proc_mat('ArtCanvasD', (0.52,0.42,0.30), 0.95, 'plaster', bump=0.25))
    cube('DiningArtBand', (0.07, 0.34, 1.5), (W/2-0.145, 1.12, 1.95),
         proc_mat('ArtBandD', (0.24,0.17,0.10), 0.95, 'plaster', bump=0.1))
    cyl('SideLampBase', 0.09, 0.16, (W/2-0.35, 1.75, 0.86), travertine, vertices=24)
    sphere('SideLampGlobe', 0.11, (W/2-0.35, 1.75, 1.05), opal, seg=20, ring=14)
    point_light('SideLampL', (W/2-0.4, 1.75, 1.05), 14, (1,0.68,0.4), 0.15)
    cyl('SideVase', 0.07, 0.3, (W/2-0.35, 0.25, 0.92), plain('SideVaseM',(0.22,0.14,0.08),0.4), vertices=20)

    # ---- plants, ceiling
    olive_tree('OliveDine', 4.85, 3.35, 2.0, 0.30)
    cube('CoveStrip', (7.2, 0.06, 0.05), (0.7, 3.6, H-0.10), plain('CoveM',(1,0.88,0.66),0.5, emission=(1,0.8,0.52), estr=1.6))
    cube('CeilingSlot', (4.0, 0.10, 0.03), (0.8, -1.6, H-0.02), black)
    ceiling_spots([-3.4, -1.6, 1.4, 3.2, 4.6], [2.9], H)

    # ---- light
    sun = bpy.data.lights.new('Sun','SUN'); sun.energy=2.9; sun.color=(1.0,0.70,0.44); sun.angle=radians(1.5)
    so = bpy.data.objects.new('Sun', sun); sc.collection.objects.link(so); so.location=(11, 26, 13)
    aim(so, (-3.0, 0.5, 0.6))
    area_light('WindowKey', (1.1, D/2-0.7, 2.4), (0.7, 0.6, 1.1), 380, (1.0,0.80,0.58), 5.2, 'RECTANGLE', 2.6)
    area_light('InteriorFill', (-3.2, -2.4, 2.9), (0.2, 1.4, 1.0), 90, (0.92,0.87,0.78), 3.4)
    area_light('GoldBounce', (3.6, 3.2, 2.1), (1.8, 1.2, 0.9), 70, (1.0,0.66,0.4), 2.2)

    camera((4.55, -2.65, 1.50), (0.35, 1.75, 1.20), 31)
    finish(sc, 'interior_dining_preview' if preview else 'interior_dining',
           (700,900) if preview else (1150,1450), 14 if preview else 48, 0.08)

# =============================================================================
# bedroom
# =============================================================================
def bedroom(preview=True):
    sc = reset()
    plaster = proc_mat('Plaster', (0.60,0.52,0.41), 0.94, 'plaster', bump=0.035)
    ceiling = proc_mat('CeilingPlaster', (0.65,0.58,0.47), 0.96, 'plaster', bump=0.02)
    floor = wood_floor_mat('OakFloor')
    linen = proc_mat('Linen', (0.68,0.62,0.50), 0.97, 'fabric', color2=(0.58,0.52,0.41), bump=0.32)
    boucle = proc_mat('Boucle', (0.58,0.51,0.40), 0.98, 'boucle', color2=(0.49,0.42,0.32), bump=0.45)
    clay = proc_mat('Clay', (0.40,0.27,0.16), 0.97, 'boucle', color2=(0.31,0.20,0.11), bump=0.4)
    travertine = proc_mat('Travertine', (0.62,0.53,0.40), 0.55, 'travertine', color2=(0.45,0.37,0.27), bump=0.15)
    oak = wood_mat('OakFurn', (0.31,0.18,0.09), (0.14,0.08,0.04), 0.38)
    bronze = plain('Bronze', (0.24,0.16,0.08), 0.26, 0.92)
    black = plain('BlackMetal', (0.04,0.04,0.035), 0.4, 0.6)
    opal = plain('Opal',(1,0.94,0.82),0.18, emission=(1,0.75,0.45), estr=6)
    bi.glass_mat = plain('Glass', (0.3,0.4,0.42), 0.05, 0.1)
    bi.glass_mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.05
    bi.glass_mat.blend_method = 'BLEND'

    W, D, H = 8.4, 8.2, 3.2
    build_room(sc, W, D, H, floor, plaster, ceiling, right_open=(0.4, 4.8, 0.18, 3.05))

    # ---- side glazing
    wx = W/2 - 0.06
    for zz in (0.18, 3.05):
        cube('WinFrameH', (0.14, 4.92, 0.09), (wx, 0.4, zz), bronze)
    for yy in (-2.0, -0.8, 0.4, 1.6, 2.8):
        cube('WinFrameV', (0.14, 0.05, 2.87), (wx, 0.4+yy-0.4, 1.61), bronze)
    cube('CurtainA', (0.06, 1.3, 3.12), (W/2-0.30, 2.72, 1.56), linen, bevel=0.012)
    cube('CurtainB', (0.06, 1.3, 3.12), (W/2-0.30, -1.9, 1.56), linen, bevel=0.012)
    plane('SkySide', (1400, 300, 1), (W/2+500, 0.4, 147), dusk_sky_mat('DuskSkySide'), rot=(radians(90), 0, radians(90)))
    city_floor()
    # distant marina through the side window
    rnd = random.Random(31)
    citymat = proc_mat('SideCity', (0.19,0.21,0.24), 0.95, 'plaster', bump=0.0, emis=(0.36,0.32,0.3), estr=0.35)
    for i in range(24):
        ty = rnd.uniform(-260, 260)
        hh = rnd.uniform(12, 70) * (1.4 if abs(ty) < 60 else 1.0)
        dd = rnd.uniform(8, 24)
        cube(f'SideTower{i}', (dd, rnd.uniform(8,24), hh), (W/2 + 230 + rnd.uniform(0,60), ty, -18 + hh/2), citymat)

    # ---- rug
    rug('Rug', 4.9, 3.5, (0, 2.25), boucle)

    # ---- bed
    cube('BedPlinth', (2.45, 2.0, 0.16), (0, 2.55, 0.08), black, bevel=0.01)
    cube('BedBase', (2.8, 2.35, 0.30), (0, 2.55, 0.31), oak, bevel=0.02)
    cube('Mattress', (2.68, 2.25, 0.32), (0, 2.55, 0.60), linen, bevel=0.075)
    cube('Duvet', (2.74, 1.85, 0.16), (0, 2.32, 0.82), linen, bevel=0.07)
    cube('DuvetFold', (2.74, 0.46, 0.18), (0, 1.52, 0.84), clay, bevel=0.05)
    for i,(px,py,pz,rz) in enumerate([(-0.58,3.18,0.96,0.05),(0.58,3.18,0.96,-0.05),(-0.56,3.44,0.93,0.09),(0.56,3.44,0.93,-0.09)]):
        cube(f'Pillow{i}', (0.8, 0.44, 0.23), (px, py, pz), linen, rot=(radians(-18),0,rz), bevel=0.09)
    for i,(px,py) in enumerate([(-0.44,3.08),(0.44,3.08)]):
        cube(f'Cushion{i}', (0.5, 0.16, 0.40), (px, py, 0.94), clay, rot=(radians(-16),0,radians(-6 if i else 6)), bevel=0.08)
    # upholstered wall panel headboard
    cube('HeadboardPanel', (3.3, 0.10, 1.55), (0, 3.94, 1.0), boucle, bevel=0.02)
    for i in (-1, 1):
        cube('HeadboardEdge', (0.03, 0.12, 1.55), (i*1.66, 3.92, 1.0), bronze)
    # bench
    cube('BenchSeat', (1.95, 0.52, 0.18), (0, 1.05, 0.48), boucle, bevel=0.06)
    for sx in (-0.8, 0.8):
        for sy in (-0.16, 0.16):
            cube('BenchLeg', (0.045, 0.045, 0.36), (sx, 1.05+sy, 0.18), black)

    # ---- triptych above bed
    for i, xx in enumerate((-1.0, 0.0, 1.0)):
        w = 0.9
        cube(f'ArtFrame{i}', (w+0.07, 0.05, 1.28), (xx, 4.0, 2.24), bronze)
        m = proc_mat(f'ArtCanvas{i}', (0.48+0.05*i,0.40+0.04*i,0.30+0.03*i), 0.95, 'plaster', bump=0.25)
        cube(f'ArtCanvasM{i}', (w, 0.06, 1.2), (xx, 3.97, 2.24), m)
        cube(f'ArtBand{i}', (w*0.28, 0.07, 1.2), (xx-0.2+0.1*i, 3.96, 2.24), proc_mat(f'ArtBandM{i}', (0.23,0.16,0.10), 0.95, 'plaster', bump=0.1))

    # ---- bedside
    for sx in (-1.72, 1.72):
        round_table(f'Night{sx}', sx, 3.25, r=0.27, h=0.52, mat=travertine, base_mat=bronze)
        cyl(f'BedLampStem{sx}', 0.014, 0.3, (sx, 3.25, 0.69), bronze, vertices=12)
        cyl(f'BedLampShade{sx}', 0.13, 0.2, (sx, 3.25, 0.92), opal, vertices=24)
        point_light(f'BedLamp{sx}', (sx, 3.27, 0.95), 18, (1,0.68,0.4), 0.18)

    # ---- dresser on left wall + mirror
    cube('Dresser', (0.46, 2.4, 0.72), (-W/2+0.29, 0.55, 0.36), oak, bevel=0.01)
    cube('DresserTop', (0.5, 2.48, 0.045), (-W/2+0.29, 0.55, 0.74), travertine, bevel=0.006)
    for sy in (-0.85, 0.85):
        cube('DresserLeg', (0.3, 0.06, 0.28), (-W/2+0.29, 0.55+sy, 0.14), black)
    cube('DresserMirror', (0.04, 1.24, 1.55), (-W/2+0.10, 0.55, 1.72), plain('MirrorM',(0.44,0.48,0.46),0.03,0.95))
    cube('DresserMirrorFrame', (0.05, 1.34, 1.65), (-W/2+0.07, 0.55, 1.72), bronze)
    cyl('DresserLampBase', 0.075, 0.18, (-W/2+0.36, 1.45, 0.85), travertine, vertices=20)
    sphere('DresserLampGlobe', 0.10, (-W/2+0.36, 1.45, 1.03), opal, seg=20, ring=14)
    point_light('DresserLampL', (-W/2+0.45, 1.45, 1.03), 12, (1,0.68,0.4), 0.15)
    cyl('DresserVase', 0.08, 0.34, (-W/2+0.34, -0.35, 0.93), plain('VaseDark',(0.2,0.13,0.08),0.4), vertices=20)
    for i in range(4):
        a = i*1.5
        cyl(f'VaseStem{i}', 0.004, 0.5, (-W/2+0.34+math.cos(a)*0.05, -0.35+math.sin(a)*0.05, 1.32), plain('Stem',(0.2,0.22,0.11),0.7), vertices=6, rot=(math.cos(a)*0.2, math.sin(a)*0.2, 0))
        sphere(f'VaseLeaf{i}', 0.04, (-W/2+0.34+math.cos(a)*0.15, -0.35+math.sin(a)*0.15, 1.5+i*0.04), plain('Leaf',(0.26,0.29,0.15),0.7), seg=10, ring=8)

    # ---- chair + plant
    armchair('BedChair', 2.7, 0.85, rot=radians(-122), fabric=boucle, accent=clay)
    import_model('potted_plant_01', (-3.15, 2.35, 0), rot_z=radians(14), scale=1.45)

    # ---- ceiling detail
    cube('CoveBed', (6.6, 0.05, 0.05), (0.2, 3.3, H-0.10), plain('CoveM',(1,0.88,0.66),0.5, emission=(1,0.8,0.52), estr=1.3))
    cube('CeilingSlotB', (5.0, 0.10, 0.03), (0.1, -1.4, H-0.02), black)
    ceiling_spots([-2.6, -0.5, 1.6, 3.4], [0.9], H)

    # ---- light
    sun = bpy.data.lights.new('Sun','SUN'); sun.energy=3.1; sun.color=(1.0,0.74,0.47); sun.angle=radians(1.5)
    so = bpy.data.objects.new('Sun', sun); sc.collection.objects.link(so); so.location=(20, 8, 12)
    aim(so, (-0.5, -0.5, 0.6))
    area_light('WindowKey', (W/2-0.7, 0.4, 2.3), (0, 1.8, 1.0), 430, (1.0,0.86,0.68), 4.6, 'RECTANGLE', 2.6)
    area_light('FillB', (-2.6, -2.8, 2.8), (0.2, 1.8, 0.9), 110, (0.86,0.89,1.0), 3.2)
    area_light('WarmB', (2.6, 3.2, 2.0), (0.6, 1.8, 0.8), 60, (1.0,0.68,0.42), 2.0)

    camera((-2.95, -3.55, 1.52), (1.05, 2.3, 1.18), 30)
    finish(sc, 'interior_bedroom_preview' if preview else 'interior_bedroom',
           (700,900) if preview else (1150,1450), 14 if preview else 48, 0.10)

# =============================================================================
# bathroom
# =============================================================================
def bath(preview=True):
    sc = reset()
    plaster = proc_mat('Plaster', (0.62,0.55,0.44), 0.94, 'plaster', bump=0.03)
    ceiling = proc_mat('CeilingPlaster', (0.66,0.59,0.48), 0.96, 'plaster', bump=0.02)
    floor = proc_mat('BathMarble', (0.55,0.48,0.39), 0.30, 'stone', color2=(0.42,0.36,0.28), bump=0.06)
    wallmarble = proc_mat('BathWall', (0.60,0.52,0.41), 0.55, 'travertine', color2=(0.46,0.39,0.30), bump=0.12)
    linen = proc_mat('Linen', (0.70,0.64,0.52), 0.97, 'fabric', color2=(0.6,0.54,0.43), bump=0.3)
    bronze = plain('Bronze', (0.42,0.29,0.13), 0.22, 0.95)
    stone = proc_mat('TubStone', (0.82,0.76,0.66), 0.18, 'stone', color2=(0.70,0.64,0.54), bump=0.03)
    oak = wood_mat('BathOak', (0.30,0.19,0.10), (0.15,0.09,0.045), 0.4)
    water = plain('Water', (0.02,0.055,0.055), 0.55, 0.0)
    bi.glass_mat = plain('Glass', (0.3,0.4,0.42), 0.05, 0.1)
    bi.glass_mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.10
    bi.glass_mat.blend_method = 'BLEND'
    opal = plain('Opal',(1,0.94,0.82),0.18, emission=(1,0.75,0.45), estr=6)

    W, D, H = 6.4, 6.8, 3.15
    build_room(sc, W, D, H, floor, wallmarble, ceiling, back_open=(0.2, 4.0, 0.5, 2.8))

    # ---- glazing
    wy = D/2 - 0.06
    cube('WinFrameT', (4.15, 0.16, 0.09), (0.2, wy, 2.8), bronze)
    cube('WinFrameB', (4.15, 0.16, 0.10), (0.2, wy, 0.5), bronze)
    for sx in (-1, 1):
        cube('WinFrameS', (0.09, 0.16, 2.3), (0.2+sx*2.0, wy, 1.65), bronze)
    for xx in (-0.6, 1.0):
        cube('WinMull', (0.04, 0.12, 2.3), (xx, wy, 1.65), bronze)
    sky_backdrop(D/2+620)
    city_floor()
    distant_skyline(D/2+560)

    # ---- freestanding oval tub
    bpy.ops.mesh.primitive_cylinder_add(vertices=72, radius=1.02, depth=0.60, location=(-0.05, 2.05, 0.33))
    outer = bpy.context.object; outer.name='Tub'; outer.scale=(1.0,0.52,1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.mesh.primitive_cylinder_add(vertices=72, radius=0.92, depth=0.54, location=(-0.05, 2.05, 0.37))
    inner = bpy.context.object; inner.scale=(1.0,0.52,1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    md = outer.modifiers.new('bool','BOOLEAN'); md.operation='DIFFERENCE'; md.object=inner
    bpy.context.view_layer.objects.active=outer; bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.data.objects.remove(inner, do_unlink=True)
    outer.data.materials.append(stone)
    for p in outer.data.polygons: p.use_smooth=True
    # smooth rim
    bpy.ops.mesh.primitive_torus_add(major_radius=0.97, minor_radius=0.035, major_segments=72, minor_segments=12, location=(-0.05, 2.05, 0.635))
    rim = bpy.context.object; rim.name='TubRim'; rim.scale=(1.0,0.52,1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    rim.data.materials.append(stone)
    for p in rim.data.polygons: p.use_smooth=True
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.90, depth=0.02, location=(-0.05, 2.05, 0.47))
    wat = bpy.context.object; wat.scale=(1.0,0.52,1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    wat.data.materials.append(water)
    for p in wat.data.polygons: p.use_smooth=True
    # floor-mounted filler
    cyl('Filler', 0.024, 0.86, (1.16, 2.05, 0.43), bronze, vertices=16)
    cyl('FillerArm', 0.02, 0.38, (0.99, 2.05, 0.86), bronze, vertices=16, rot=(0,radians(90),0))
    cyl('FillerSpout', 0.018, 0.16, (0.82, 2.05, 0.78), bronze, vertices=12)
    # tub tray + towel
    cube('TubTray', (0.62, 0.16, 0.025), (-0.55, 2.05, 0.66), bronze)
    cube('TubTowel', (0.34, 0.10, 0.08), (-0.55, 2.05, 0.70), linen, bevel=0.02)
    cyl('TubCandle', 0.055, 0.09, (-0.28, 1.9, 0.71), plain('Candle',(0.85,0.78,0.64),0.6), vertices=20)
    sphere('CandleFlame', 0.018, (-0.28, 1.9, 0.775), opal, seg=8, ring=6)

    # ---- vanity, left wall: floating stone + round backlit mirror
    vx = -W/2 + 0.30
    cube('Vanity', (0.60, 2.0, 0.62), (vx, 1.55, 0.52), wallmarble, bevel=0.008)
    cube('VanityTop', (0.66, 2.1, 0.07), (vx, 1.55, 0.865), stone, bevel=0.008)
    cube('VanityShadow', (0.52, 1.9, 0.10), (vx-0.02, 1.55, 0.21), plain('ShadowM',(0.1,0.08,0.06),0.8))
    cyl('BasinOuter', 0.235, 0.14, (vx+0.05, 1.55, 0.955), stone, vertices=40)
    cyl('BasinInner', 0.20, 0.125, (vx+0.05, 1.55, 0.975), floor, vertices=40)
    cyl('BasinRim', 0.235, 0.012, (vx+0.05, 1.55, 1.03), bronze, vertices=40)
    cyl('FaucetV', 0.018, 0.4, (vx-0.14, 1.55, 1.02), bronze, vertices=12)
    cyl('FaucetSpout', 0.016, 0.22, (vx-0.04, 1.55, 1.21), bronze, vertices=12, rot=(0,radians(90),0))
    # round mirror
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.62, depth=0.03, location=(vx-0.155, 1.55, 1.95), rotation=(0, radians(90), 0))
    mir = bpy.context.object; mir.name='RoundMirror'
    mir.data.materials.append(plain('MirrorM',(0.42,0.47,0.45),0.03,0.95))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.62, minor_radius=0.022, major_segments=64, minor_segments=10, location=(vx-0.145, 1.55, 1.95), rotation=(0, radians(90), 0))
    mirr = bpy.context.object; mirr.name='MirrorRing'; mirr.data.materials.append(bronze)
    # backlight halo
    cube('MirrorHalo', (0.02, 1.5, 0.02), (vx-0.17, 1.55, 2.60), opal)
    # marble shelf + folded towels
    cube('VanityShelf', (0.34, 1.2, 0.05), (vx+0.02, 0.55, 1.15), stone, bevel=0.006)
    for i in range(2):
        cube(f'FoldTowel{i}', (0.3, 0.36, 0.07), (vx+0.02, 0.55, 1.21+i*0.075), linen, bevel=0.012)
    # stool tucked under
    cyl('VanityStool', 0.20, 0.42, (vx+0.36, 1.15, 0.21), stone, vertices=28)
    cube('StoolPad', (0.34, 0.34, 0.06), (vx+0.36, 1.15, 0.45), linen, bevel=0.02)

    # ---- towel warmer + bench, right wall
    for i in range(5):
        cyl(f'TowelBar{i}', 0.012, 1.0, (W/2-0.10, 1.5, 1.15+i*0.20), bronze, vertices=10, rot=(0,radians(90),0))
    for zz in (1.1, 2.0):
        cyl(f'TowelPost{zz}', 0.014, 0.9, (W/2-0.10, 2.0, zz), bronze, vertices=10, rot=(radians(90),0,0))
    cube('TowelWarm', (0.16, 0.5, 0.5), (W/2-0.14, 1.45, 1.4), linen, bevel=0.03)
    cube('BathBench', (0.45, 1.4, 0.34), (W/2-0.42, 0.4, 0.18), oak, bevel=0.02)
    cube('BenchPadB', (0.44, 1.35, 0.09), (W/2-0.42, 0.4, 0.39), linen, bevel=0.035)
    cube('BenchTowel', (0.40, 0.5, 0.08), (W/2-0.42, 0.7, 0.47), linen, bevel=0.02)

    # ---- accessorize: ladder, plant
    cube('LadderRail', (0.4, 0.035, 0.035), (-2.2, -2.62, 1.7), bronze, rot=(0,radians(12),0))
    for i in range(3):
        cube(f'LadderStep{i}', (0.38, 0.03, 0.03), (-2.2, -2.62, 1.1+i*0.28), bronze, rot=(0,radians(12),0))
    for i in range(3):
        cube(f'Towel{i}', (0.34, 0.055, 0.26), (-2.18+i*0.02, -2.62, 1.2+i*0.27), linen, bevel=0.015)
    cyl('BathBranchVase', 0.09, 0.34, (W/2-0.55, 2.55, 0.10), stone, vertices=24)
    for i in range(4):
        a = i*1.6
        cyl(f'BathBranch{i}', 0.006, 0.7, (W/2-0.55+math.cos(a)*0.06, 2.55+math.sin(a)*0.06, 0.6), plain('BranchM',(0.22,0.16,0.10),0.8), vertices=6, rot=(math.cos(a)*0.25, math.sin(a)*0.25, 0))

    # ---- light
    sun = bpy.data.lights.new('Sun','SUN'); sun.energy=2.8; sun.color=(1.0,0.76,0.5); sun.angle=radians(1.5)
    so = bpy.data.objects.new('Sun', sun); sc.collection.objects.link(so); so.location=(12, 22, 11)
    aim(so, (-1.0, 0.5, 0.5))
    area_light('WindowKey', (0.2, D/2-0.6, 2.4), (-0.2, 1.4, 1.0), 380, (1.0,0.88,0.7), 4.4, 'RECTANGLE', 2.2)
    area_light('FillBath', (-2.4, -2.0, 2.7), (0.4, 1.2, 0.9), 110, (0.86,0.9,1.0), 2.8)
    spot = bpy.data.lights.new('TubSpot','SPOT'); spot.energy=300; spot.color=(1,0.76,0.5); spot.spot_size=radians(58)
    spo = bpy.data.objects.new('TubSpot', spot); sc.collection.objects.link(spo); spo.location=(-0.05,1.4,3.0); aim(spo,(-0.05,2.0,0.5))
    cube('CoveBath', (4.6, 0.05, 0.05), (0.2, 3.1, H-0.10), plain('CoveM',(1,0.88,0.66),0.5, emission=(1,0.8,0.52), estr=1.4))
    point_light('MirrorL', (vx+0.1, 1.55, 2.2), 16, (1,0.72,0.45), 0.2)

    camera((0.75, -2.95, 1.50), (-1.05, 2.00, 1.42), 25)
    finish(sc, 'interior_bath_preview' if preview else 'interior_bath',
           (700,900) if preview else (1150,1450), 14 if preview else 48, 0.10)
if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['all','preview']
    which = args[0] if args else 'all'
    preview = (args[1] if len(args)>1 else 'preview') == 'preview'
    fns = {'living': living, 'dining': dining, 'bedroom': bedroom, 'bath': bath}
    for name, fn in (fns.items() if which == 'all' else [(which, fns[which])]):
        fn(preview)
    print('DONE')


