import bpy, bmesh, math, random, os, sys, time
from mathutils import Vector, Matrix
from math import pi, sin, cos, radians

ROOT = r"D:\SARIT\NOVEXA- NoirDemons\cinematic flat website by deep seek"
MODELS = os.path.join(ROOT, "reference", "source", "models")
TEX = os.path.join(ROOT, "reference", "source", "tex")
OUT = os.path.join(ROOT, "public", "images")
os.makedirs(OUT, exist_ok=True)

# -----------------------------------------------------------------------------
# helpers
# -----------------------------------------------------------------------------
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 32
    try:
        sc.eevee.use_raytracing = True
    except Exception:
        pass
    sc.render.film_transparent = False
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = 0.35
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 93
    # soft cool ambient for depth
    world = bpy.data.worlds.new('AmbientWorld')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.55, 0.64, 0.78, 1)
        bg.inputs['Strength'].default_value = 0.16
    sc.world = world
    return sc

def tex_mat(name, tex, scale=1.0, rough_mul=1.0, normal_strength=0.35, tint=(1,1,1,1)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = tint
    uv = nodes.new('ShaderNodeTexCoord')
    mp = nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, 1)
    links.new(uv.outputs['UV'], mp.inputs['Vector'])
    def img(kind, noncolor=False):
        p = os.path.join(TEX, f"{tex}_{kind}_2k.jpg")
        if not os.path.exists(p):
            return None
        n = nodes.new('ShaderNodeTexImage')
        n.image = bpy.data.images.load(p, check_existing=True)
        if noncolor:
            n.image.colorspace_settings.name = 'Non-Color'
        links.new(mp.outputs['Vector'], n.inputs['Vector'])
        return n
    dif = img('Diffuse')
    if dif:
        links.new(dif.outputs['Color'], bsdf.inputs['Base Color'])
    r = img('Rough', True)
    if r:
        rm = nodes.new('ShaderNodeMath'); rm.operation = 'MULTIPLY'
        rm.inputs[1].default_value = rough_mul
        links.new(r.outputs['Color'], rm.inputs[0])
        links.new(rm.outputs['Value'], bsdf.inputs['Roughness'])
    nrm = img('nor_gl', True)
    if nrm:
        nm = nodes.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = normal_strength
        links.new(nrm.outputs['Color'], nm.inputs['Color'])
        links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return mat

def plain(name, color, rough=0.7, metal=0.0, emission=None, estr=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = mat.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emission:
        b.inputs['Emission Color'].default_value = (*emission, 1)
        b.inputs['Emission Strength'].default_value = estr
    return mat

def cube(name, size, loc, mat, rot=(0,0,0), bevel=0.0, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        m = ob.modifiers.new('b', 'BEVEL'); m.width = bevel; m.segments = 4
        bpy.ops.object.modifier_apply(modifier=m.name)
    ob.data.materials.append(mat)
    if parent: ob.parent = parent
    return ob

def plane(name, size, loc, mat, rot=(0,0,0), parent=None):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    if parent: ob.parent = parent
    return ob

def cyl(name, r, depth, loc, mat, vertices=48, rot=(0,0,0), smooth=True, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=r, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(mat)
    if smooth:
        for p in ob.data.polygons: p.use_smooth = True
    if parent: ob.parent = parent
    return ob

def sphere(name, r, loc, mat, seg=32, ring=16, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=r, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    if parent: ob.parent = parent
    return ob

def aim(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def area_light(name, loc, target, energy, color, size, shape='RECTANGLE', size_y=None):
    l = bpy.data.lights.new(name, 'AREA')
    l.energy = energy
    l.color = color
    l.shape = shape
    if size_y: l.size = size; l.size_y = size_y
    else: l.size = size
    ob = bpy.data.objects.new(name, l)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    aim(ob, target)
    return ob

def point_light(name, loc, energy, color, radius=0.15):
    l = bpy.data.lights.new(name, 'POINT')
    l.energy = energy
    l.color = color
    l.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, l)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    return ob

def camera(loc, target, lens=40, ortho=None):
    cam = bpy.data.cameras.new('Cam')
    cam.lens = lens
    cam.clip_end = 8000
    cam.clip_start = 0.05
    if ortho:
        cam.type = 'ORTHO'; cam.ortho_scale = ortho
    ob = bpy.data.objects.new('Cam', cam)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    aim(ob, target)
    bpy.context.scene.camera = ob
    return ob

def import_model(name, loc, rot_z=0, scale=1.0):
    f = os.path.join(MODELS, name, name + ".gltf")
    if not os.path.exists(f):
        print('SKIP missing model', name)
        return None, []
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f)
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new('GRP_' + name, None)
    bpy.context.scene.collection.objects.link(root)
    root.location = (loc[0], loc[1], loc[2])
    root.rotation_euler = (0, 0, rot_z)
    root.scale = (scale, scale, scale)
    meshes = [o for o in new if o.type == 'MESH']
    for o in new:
        if o.parent is None:
            o.parent = root
    return root, meshes

def gradient_sky(name, loc, size, top=(0.62,0.72,0.86), bottom=(0.95,0.72,0.55), strength=1.4, rot=(0,0,0)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (*bottom, 1)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (*top, 1)
    nt.links.new(tc.outputs['Generated'], sep.inputs['Vector'])
    nt.links.new(sep.outputs['Y'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color'])
    em.inputs['Strength'].default_value = strength
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    ob = plane(name, size, loc, mat, rot=rot)
    return ob

def palms(name, x, y, z, h, scale=1.0, seed=1):
    rnd = random.Random(seed)
    trunk = plain('PalmTrunk', (0.16, 0.12, 0.08), 0.9)
    leafm = plain('PalmLeaf', (0.12, 0.18, 0.08), 0.65)
    leafm2 = plain('PalmLeafLight', (0.22, 0.28, 0.11), 0.6)
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.22*scale, radius2=0.1*scale, depth=h, location=(x,y,z+h/2))
    t = bpy.context.object; t.name = name+'_trunk'; t.data.materials.append(trunk)
    crown = Vector((x, y, z+h))
    for f in range(16):
        ang = f/16*2*pi + rnd.uniform(-0.2,0.2)
        L = (2.3+rnd.uniform(-0.4,0.7))*scale
        lift = rnd.uniform(0.35,0.9)*scale
        drop = rnd.uniform(1.0,1.8)*scale
        for i in range(1, 9):
            tpar = i/8
            bx = crown.x + cos(ang)*L*tpar
            by = crown.y + sin(ang)*L*tpar
            bz = crown.z + lift*sin(tpar*pi*0.9) - drop*(tpar**2)
            for s in (-1,1):
                side = Vector((-sin(ang), cos(ang), 0))
                ll = (0.6*(1-tpar)+0.15)*scale
                tip = Vector((bx,by,bz)) + side*s*ll + Vector((cos(ang)*0.1, sin(ang)*0.1, -ll*0.4))
                w = 0.10*scale
                verts = [Vector((bx,by,bz))+side*w*0.3, tip, Vector((bx,by,bz))]
                me = bpy.data.meshes.new(name+'_leaf')
                me.from_pydata([tuple(v) for v in verts], [], [(0,1,2)])
                me.update()
                lob = bpy.data.objects.new(name+'_leaf', me)
                bpy.context.scene.collection.objects.link(lob)
                lob.data.materials.append(leafm if f%3 else leafm2)

def rug(name, w, d, loc, mat):
    ob = plane(name, (w,d,1), (loc[0],loc[1],0.012), mat)
    return ob

# -----------------------------------------------------------------------------
# shared materials per scene are created after reset
# -----------------------------------------------------------------------------
def build_room(sc, w, d, h, mat_floor, mat_wall, mat_ceiling, back_open=None, right_open=None, side=True, back=True):
    cube('Floor', (w, d, 0.1), (0, 0, -0.05), mat_floor)
    cube('Ceiling', (w, d, 0.1), (0, 0, h+0.05), mat_ceiling)
    cube('Wall_L', (0.15, d, h), (-w/2, 0, h/2), mat_wall)
    if right_open:
        cy, ow, z0, z1 = right_open
        # segments fore/aft of the window + header + sill
        front = (cy - ow/2) - (-d/2)
        back = (d/2) - (cy + ow/2)
        cube('Wall_R_front', (0.15, max(front, 0.01), h), (w/2, (-d/2 + cy - ow/2)/2, h/2), mat_wall)
        cube('Wall_R_back', (0.15, max(back, 0.01), h), (w/2, (d/2 + cy + ow/2)/2, h/2), mat_wall)
        cube('Wall_R_sill', (0.15, ow, max(z0, 0.01)), (w/2, cy, z0/2), mat_wall)
        cube('Wall_R_header', (0.15, ow, max(h - z1, 0.01)), (w/2, cy, (h + z1)/2), mat_wall)
    else:
        cube('Wall_R', (0.15, d, h), (w/2, 0, h/2), mat_wall)
    if back:
        if back_open:
            cx, ow, z0, z1 = back_open
            left = (cx - ow/2) - (-w/2)
            right = (w/2) - (cx + ow/2)
            cube('Wall_B_left', (max(left, 0.01), 0.15, h), ((-w/2 + cx - ow/2)/2, d/2, h/2), mat_wall)
            cube('Wall_B_right', (max(right, 0.01), 0.15, h), ((w/2 + cx + ow/2)/2, d/2, h/2), mat_wall)
            cube('Wall_B_sill', (ow, 0.15, max(z0, 0.01)), (cx, d/2, z0/2), mat_wall)
            cube('Wall_B_header', (ow, 0.15, max(h - z1, 0.01)), (cx, d/2, (h + z1)/2), mat_wall)
        else:
            cube('Wall_B', (w, 0.15, h), (0, d/2, h/2), mat_wall)
    if side:
        cube('Wall_F', (w, 0.15, h), (0, -d/2, h/2), mat_wall)

def window(sc, x, z, w, h, y, mat_frame, curtain_mat=None, sky=True):
    # large glazed opening with thin bronze frame, set into back wall
    cube('WinGlass', (w, 0.06, h), (x, y-0.02, z), glass_mat, bevel=0.0)
    cube('WinFrameT', (w+0.12, 0.16, 0.09), (x, y, z+h/2), mat_frame)
    cube('WinFrameB', (w+0.12, 0.16, 0.09), (x, y, z-h/2), mat_frame)
    cube('WinFrameL', (0.09, 0.16, h), (x-w/2, y, z), mat_frame)
    cube('WinFrameR', (0.09, 0.16, h), (x+w/2, y, z), mat_frame)
    for i in range(1, 4):
        cube(f'WinMull{i}', (0.045, 0.12, h), (x-w/2+i*w/4, y, z), mat_frame)
    if curtain_mat:
        for sx in (-1,1):
            cube(f'Curtain{sx}', (w*0.22, 0.06, h+0.2), (x+sx*(w/2+0.02), y-0.14, z), curtain_mat, bevel=0.01)

# =============================================================================
# SCENE 1 â€” LIVING ROOM
# =============================================================================
def scene_living(preview=True):
    sc = reset()
    sc.render.resolution_x = 700 if preview else 1100
    sc.render.resolution_y = 900 if preview else 1400
    sc.eevee.taa_render_samples = 12 if preview else 48
    global glass_mat
    plaster = tex_mat('Plaster', 'white_plaster_rough_02', scale=2.5, rough_mul=1.0, tint=(0.92,0.87,0.78,1))
    oak = tex_mat('OakFloor', 'mocha_oak_veneer', scale=3.2, rough_mul=1.1)
    linen = tex_mat('Linen', 'rough_linen', scale=2.0, rough_mul=1.0, tint=(0.86,0.83,0.75,1))
    boucle = tex_mat('Boucle', 'wool_boucle', scale=3.0)
    marble = tex_mat('Marble', 'marble_01', scale=1.2, rough_mul=0.7, normal_strength=0.15)
    glass_mat = plain('Glass', (0.35,0.45,0.48), 0.03, 0.1)
    glass_mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.12
    glass_mat.blend_method = 'BLEND'
    bronze = plain('Bronze', (0.23,0.16,0.09), 0.28, 0.9)
    dark = plain('Dark', (0.08,0.075,0.06), 0.6)
    cream = plain('Cream', (0.82,0.77,0.67), 0.8)
    warm = plain('WarmGlow', (1,0.8,0.55), 0.5, emission=(1,0.62,0.3), estr=4)
    black = plain('BlackMetal', (0.03,0.03,0.03), 0.35, 0.7)

    W, D, H = 10.4, 10.0, 3.35
    build_room(sc, W, D, H, oak, plaster, plaster, back_open=(0, 6.4, 0.25, 3.25))
    window(sc, 0, 1.75, 6.4, 3.0, D/2-0.1, bronze, linen)

    # outside dusk sky + distant towers
    gradient_sky('SkyBackdrop', (0, D/2+7, 4.5), (34, 16, 1), top=(0.42,0.52,0.66), bottom=(0.96,0.66,0.42), strength=1.1, rot=(radians(90),0,0))
    rnd = random.Random(3)
    for i in range(9):
        x = -11 + i*2.9 + rnd.uniform(-0.5,0.5)
        hh = rnd.uniform(2.5, 9.0)
        cube(f'City{i}', (rnd.uniform(1.2,2.4), 1.2, hh), (x, D/2+6.8, hh/2), plain('CityMat', (0.13,0.14,0.14), 0.9))
        for j in range(int(hh)):
            if rnd.random() > 0.55:
                cube(f'CityWin{i}_{j}', (0.5,0.05,0.16), (x, D/2+6.18, 0.6+j*1.0), warm)

    # rug + sofa
    rug('Rug', 5.0, 3.8, (0.1, 0.6), boucle)
    import_model('Sofa_01', (0.15, 2.35, 0), rot_z=0, scale=1.35)
    import_model('CoffeeTable_01', (0.1, 0.55, 0), rot_z=0, scale=1.05)
    import_model('modern_arm_chair_01', (-2.55, 0.85, 0), rot_z=radians(62), scale=1.05)
    # side table + lamp
    cyl('SideTableA', 0.32, 0.06, (-1.75, 2.6, 0.5), marble, vertices=40)
    cyl('SideTableA_leg', 0.045, 0.5, (-1.75, 2.6, 0.25), bronze, vertices=16)
    cyl('SideLampBase', 0.10, 0.36, (-1.75, 2.6, 0.71), bronze, vertices=24)
    sphere('SideLampShade', 0.17, (-1.75, 2.6, 0.93), cream)
    point_light('SideLampLight', (-1.75, 2.6, 0.9), 35, (1.0,0.62,0.32), 0.18)

    # floor plant
    import_model('potted_plant_01', (3.85, 2.7, 0), rot_z=radians(-20), scale=1.45)
    import_model('potted_plant_01', (-4.2, 2.9, 0), rot_z=radians(15), scale=1.15)

    # pendant above coffee table
    cyl('PendantCord', 0.012, 0.85, (0.1, 0.55, H-0.43), black, vertices=8)
    cyl('PendantShade', 0.35, 0.12, (0.1, 0.55, H-0.88), bronze, vertices=40)
    sphere('PendantBulb', 0.09, (0.1, 0.55, H-0.96), warm)
    point_light('PendantLight', (0.1, 0.55, H-0.98), 70, (1.0,0.68,0.38), 0.3)

    # art on left wall
    cube('ArtFrame', (0.05, 2.0, 2.6), (-W/2+0.12, 0.4, 1.95), bronze, bevel=0.01)
    cube('ArtCanvas', (0.06, 1.86, 2.46), (-W/2+0.18, 0.4, 1.95), plain('Art', (0.55,0.44,0.33), 0.9))
    cube('ArtInset', (0.07, 1.0, 1.6), (-W/2+0.19, 0.55, 1.9), plain('Art2', (0.72,0.63,0.51), 0.95))

    # ceiling cove
    cube('Cove', (W-1.6, 0.08, 0.1), (0, -D/2+0.85, H-0.08), plain('CoveGlow', (1,0.85,0.6), 0.5, emission=(1,0.78,0.5), estr=2.2))
    cube('CoveBand', (W-1.2, 0.35, 0.12), (0, -D/2+1.05, H-0.18), plaster)

    # lights
    area_light('WindowKey', (0, D/2-0.8, 2.4), (0, 0, 1.2), 1500, (1.0,0.75,0.5), 4.0, 'RECTANGLE', 2.6)
    area_light('Fill', (-3.2, -2.0, 2.8), (0.5, 1.5, 0.8), 420, (0.72,0.82,1.0), 3.5, 'RECTANGLE', 2.5)
    area_light('Rim', (3.0, 3.6, 2.9), (0.0, 1.5, 1.0), 300, (1.0,0.9,0.78), 2.0)

    camera((0.1, -4.35, 1.55), (0.05, 2.2, 1.25), 36)
    sc.render.filepath = os.path.join(OUT, 'interior_living_preview.jpg' if preview else 'interior_living.jpg')
    t = time.time(); bpy.ops.render.render(write_still=True)
    print('RENDERED living', round(time.time()-t,1))

# =============================================================================
# SCENE 2 â€” KITCHEN & DINING
# =============================================================================
def scene_dining(preview=True):
    sc = reset()
    sc.render.resolution_x = 700 if preview else 1100
    sc.render.resolution_y = 900 if preview else 1400
    sc.eevee.taa_render_samples = 12 if preview else 48
    global glass_mat
    plaster = tex_mat('Plaster', 'white_plaster_rough_02', scale=2.5, tint=(0.93,0.89,0.81,1))
    oak = tex_mat('Oak', 'mocha_oak_veneer', scale=2.2)
    marble = tex_mat('Marble', 'marble_01', scale=1.1, rough_mul=0.75, normal_strength=0.12)
    linen = tex_mat('Linen', 'rough_linen', scale=2.0, tint=(0.87,0.83,0.74,1))
    boucle = tex_mat('Boucle', 'wool_boucle', scale=2.2)
    stone = tex_mat('Concrete', 'concrete_floor_03', scale=3.0)
    glass_mat = plain('Glass', (0.3,0.4,0.42), 0.05, 0.1); glass_mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.14; glass_mat.blend_method='BLEND'
    bronze = plain('Bronze', (0.22,0.15,0.08), 0.3, 0.9)
    black = plain('Black', (0.04,0.04,0.035), 0.4, 0.5)
    warm = plain('Warm', (1,0.8,0.55), 0.5, emission=(1,0.63,0.32), estr=4)
    white = plain('White', (0.9,0.87,0.8), 0.85)

    W, D, H = 11.0, 10.0, 3.3
    build_room(sc, W, D, H, stone, plaster, plaster, back_open=(1.2, 6.2, 0.35, 3.25))
    window(sc, 1.2, 1.8, 6.2, 2.9, D/2-0.1, bronze, linen)
    gradient_sky('SkyBackdrop', (0, D/2+7, 4.5), (34, 16, 1), top=(0.5,0.58,0.7), bottom=(0.94,0.7,0.5), strength=1.0, rot=(radians(90),0,0))
    rnd = random.Random(7)
    for i in range(7):
        x = -8 + i*3.2
        hh = rnd.uniform(3, 8)
        cube(f'City{i}', (2.0, 1.0, hh), (x, D/2+7, hh/2), plain('CityMat', (0.16,0.17,0.16), 0.9))

    # kitchen island left
    cube('IslandBase', (3.4, 1.3, 0.9), (-2.6, 1.3, 0.45), oak, bevel=0.02)
    cube('IslandTop', (3.7, 1.55, 0.09), (-2.6, 1.3, 0.945), marble, bevel=0.015)
    cube('IslandWaterfall', (0.08, 1.55, 0.9), (-4.36, 1.3, 0.45), marble)
    # back cabinetry
    cube('Cabinet', (4.2, 0.55, 2.6), (-2.75, D/2-0.48, 1.3), oak, bevel=0.01)
    for i in range(4):
        cube(f'CabinetLine{i}', (0.015, 0.02, 2.5), (-4.0+i*1.2, D/2-0.79, 1.28), black)
    cube('Splash', (4.2, 0.06, 0.75), (-2.75, D/2-0.82, 0.45), marble)
    # shelves + objects
    for i in range(3):
        cube(f'Shelf{i}', (2.4, 0.28, 0.05), (-2.7, D/2-0.55, 2.35-i*0.45), bronze)
    # dining right
    import_model('dining_table', (2.0, 1.3, 0), rot_z=radians(90), scale=1.15)
    for i,(dx,dy,rz) in enumerate([(-0.55,1.35,pi/2),(-0.55,-1.35,-pi/2),(1.55,1.35,pi/2),(1.55,-1.35,-pi/2),(0.5,-1.35,-pi/2)]):
        import_model('dining_chair_02', (2.0+dx, 1.3+dy, 0), rot_z=rz, scale=1.05)
    # pendant row over island
    for i in range(3):
        cyl(f'PL{i}', 0.01, 0.7, (-3.6+i*1.0, 1.3, H-0.35), black, vertices=8)
        cyl(f'PS{i}', 0.18, 0.24, (-3.6+i*1.0, 1.3, H-0.72), bronze, vertices=28)
        sphere(f'PB{i}', 0.06, (-3.6+i*1.0, 1.3, H-0.82), warm)
        point_light(f'PLight{i}', (-3.6+i*1.0, 1.3, H-0.85), 40, (1,0.65,0.35), 0.2)
    # island stools
    for i in range(3):
        cyl(f'StoolSeat{i}', 0.2, 0.06, (-3.55+i*0.95, 0.15, 0.62), boucle, vertices=32)
        cyl(f'StoolLeg{i}', 0.03, 0.6, (-3.55+i*0.95, 0.15, 0.31), bronze, vertices=12)
    # plant right foreground
    import_model('potted_plant_01', (4.4, 2.9, 0), scale=1.6)
    # rug under dining
    rug('Rug', 4.6, 3.6, (2.0, 1.3), boucle)
    # lighting
    area_light('WindowKey', (1.2, D/2-0.8, 2.4), (0.5, 1.5, 1.2), 1700, (1.0,0.76,0.52), 4.2, 'RECTANGLE', 2.5)
    area_light('Fill', (-2, -2.5, 2.9), (-2.5, 1.5, 1.0), 480, (0.75,0.84,1.0), 3.5)
    camera((-0.4, -4.3, 1.55), (0.2, 2.0, 1.25), 31)
    sc.render.filepath = os.path.join(OUT, 'interior_dining_preview.jpg' if preview else 'interior_dining.jpg')
    t=time.time(); bpy.ops.render.render(write_still=True); print('RENDERED dining', round(time.time()-t,1))

# =============================================================================
# SCENE 3 â€” BEDROOM
# =============================================================================
def scene_bedroom(preview=True):
    sc = reset()
    sc.render.resolution_x = 700 if preview else 1100
    sc.render.resolution_y = 900 if preview else 1400
    sc.eevee.taa_render_samples = 12 if preview else 48
    global glass_mat
    plaster = tex_mat('Plaster', 'white_plaster_rough_02', scale=2.4, tint=(0.9,0.85,0.76,1))
    oak = tex_mat('Oak', 'mocha_oak_veneer', scale=3.0)
    linen = tex_mat('Linen', 'rough_linen', scale=1.6, tint=(0.93,0.9,0.83,1))
    boucle = tex_mat('Boucle', 'wool_boucle', scale=2.0)
    marble = tex_mat('Marble', 'marble_01', scale=1.0)
    glass_mat = plain('Glass', (0.3,0.4,0.42), 0.05, 0.1); glass_mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.12; glass_mat.blend_method='BLEND'
    bronze = plain('Bronze', (0.22,0.15,0.08), 0.3, 0.9)
    dark = plain('DarkWood', (0.11,0.08,0.05), 0.55)
    cream = plain('Cream', (0.86,0.82,0.73), 0.85)
    warm = plain('Warm', (1,0.8,0.55), 0.5, emission=(1,0.64,0.34), estr=3.5)

    W, D, H = 8.0, 8.0, 3.15
    build_room(sc, W, D, H, oak, plaster, plaster, right_open=(0.3, 4.4, 0.2, 2.9))
    # window on right wall (side)
    cube('WinGlass', (0.05, 4.4, 2.7), (W/2-0.08, 0.3, 1.55), glass_mat)
    for zz in (0.2, 2.9):
        cube('WinFrameH', (0.14, 4.6, 0.09), (W/2-0.05, 0.3, zz), bronze)
    for yy in (-1.9, -0.6, 0.7, 2.0, 2.6):
        cube('WinFrameV', (0.14, 0.06, 2.7), (W/2-0.05, 0.3+yy, 1.55), bronze)
    cube('CurtainR', (0.06, 1.3, 3.0), (W/2-0.25, 2.9, 1.5), linen, bevel=0.01)
    cube('CurtainR2', (0.06, 1.3, 3.0), (W/2-0.25, -2.3, 1.5), linen, bevel=0.01)
    gradient_sky('SkySide', (W/2+6, 0.3, 3.0), (18, 18, 1), top=(0.55,0.64,0.78), bottom=(0.95,0.75,0.55), strength=1.1, rot=(radians(90),0,radians(-90)))
    # bed
    cube('BedBase', (2.5, 2.15, 0.3), (0, 2.6, 0.15), dark, bevel=0.03)
    cube('Mattress', (2.4, 2.1, 0.3), (0, 2.6, 0.44), linen, bevel=0.07)
    cube('Duvet', (2.45, 1.65, 0.16), (0, 2.35, 0.64), cream, bevel=0.08)
    cube('DuvetFold', (2.45, 0.45, 0.17), (0, 1.75, 0.65), linen, bevel=0.06)
    for i,(px,py) in enumerate([(-0.55,3.05),(0.55,3.05),(-0.55,3.45),(0.55,3.45)]):
        cube(f'Pillow{i}', (0.8, 0.45, 0.22), (px, py, 0.78+ (0.06 if i>1 else 0)), cream, rot=(radians(-15),0,0), bevel=0.09)
    cube('Headboard', (2.85, 0.14, 1.55), (0, 3.85, 0.95), boucle, bevel=0.04)
    cube('HeadboardFrame', (2.95, 0.08, 1.62), (0, 3.97, 0.97), bronze, bevel=0.01)
    # bench + throw
    cube('Bench', (1.8, 0.5, 0.4), (0, 1.1, 0.22), boucle, bevel=0.06)
    for sx in (-0.75,0.75):
        for sy in (-0.15,0.15):
            cube('BenchLeg', (0.06,0.06,0.2), (sx, 1.1+sy, 0.1), dark)
    # rugs
    rug('Rug', 5.0, 4.0, (0, 2.0), boucle)
    # side tables
    for sx in (-1.7,1.7):
        cube('SideTable', (0.55, 0.5, 0.5), (sx, 3.3, 0.25), dark, bevel=0.02)
        cube('SideTop', (0.6, 0.55, 0.04), (sx, 3.3, 0.52), marble)
        cyl('LampBase', 0.06, 0.3, (sx, 3.3, 0.69), bronze, vertices=20)
        sphere('LampShade', 0.16, (sx, 3.3, 0.9), cream)
        point_light('BedLamp', (sx, 3.3, 0.95), 30, (1,0.65,0.35), 0.2)
    # art above bed
    cube('ArtFrame', (1.9, 0.05, 1.1), (0, 3.89, 2.2), bronze)
    cube('ArtCanvas', (1.78, 0.06, 0.98), (0, 3.85, 2.2), plain('Art', (0.5,0.42,0.33), 0.9))
    cube('ArtMark', (1.0, 0.07, 0.02), (0, 3.84, 2.2), bronze)
    # plant + chair
    import_model('potted_plant_01', (-3.2, 1.2, 0), scale=1.4)
    import_model('modern_arm_chair_01', (2.6, 1.0, 0), rot_z=radians(-125), scale=1.0)
    # sheer light
    area_light('WindowKey', (W/2-0.8, 0.3, 2.2), (0, 1.5, 1.0), 1400, (1.0,0.78,0.55), 3.4, 'RECTANGLE', 2.4)
    area_light('Fill', (-2.0, -2.5, 2.7), (0, 1.8, 0.9), 300, (0.78,0.85,1.0), 3.0)
    camera((0, -3.0, 1.5), (0, 2.6, 1.15), 36)
    sc.render.filepath = os.path.join(OUT, 'interior_bedroom_preview.jpg' if preview else 'interior_bedroom.jpg')
    t=time.time(); bpy.ops.render.render(write_still=True); print('RENDERED bedroom', round(time.time()-t,1))

# =============================================================================
# SCENE 4 â€” BATHROOM
# =============================================================================
def scene_bath(preview=True):
    sc = reset()
    sc.render.resolution_x = 700 if preview else 1100
    sc.render.resolution_y = 900 if preview else 1400
    sc.eevee.taa_render_samples = 12 if preview else 48
    global glass_mat
    marble = tex_mat('Marble', 'marble_01', scale=1.0, rough_mul=0.55, normal_strength=0.1)
    marble_wall = tex_mat('MarbleWall', 'marble_01', scale=0.8, rough_mul=0.7, normal_strength=0.25, tint=(0.88,0.84,0.76,1))
    plaster = tex_mat('Plaster', 'white_plaster_rough_02', scale=2.5, tint=(0.9,0.86,0.78,1))
    linen = tex_mat('Linen', 'rough_linen', scale=2.0, tint=(0.95,0.92,0.86,1))
    glass_mat = plain('Glass', (0.3,0.4,0.42), 0.05, 0.1); glass_mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.12; glass_mat.blend_method='BLEND'
    bronze = plain('Bronze', (0.35,0.24,0.12), 0.25, 0.95)
    stone = plain('Stone', (0.72,0.66,0.55), 0.75)
    warm = plain('Warm', (1,0.82,0.58), 0.5, emission=(1,0.66,0.36), estr=3.0)
    foliage = plain('Foliage', (0.14,0.2,0.09), 0.65)
    trunk = plain('Trunk', (0.15,0.11,0.07), 0.9)

    W, D, H = 6.4, 7.0, 3.1
    build_room(sc, W, D, H, marble, marble_wall, plaster, back_open=(0, 3.6, 0.55, 2.75))
    # window over tub
    cube('WinGlass', (3.6, 0.05, 2.2), (0, D/2-0.08, 1.65), glass_mat)
    for zz in (0.55, 2.75):
        cube('WinFrameH', (3.8, 0.13, 0.08), (0, D/2-0.05, zz), bronze)
    for xx in (-1.8, -0.6, 0.6, 1.8):
        cube('WinFrameV', (0.06, 0.13, 2.2), (xx, D/2-0.05, 1.65), bronze)
    gradient_sky('Sky', (0, D/2+6, 3.5), (22, 14, 1), top=(0.5,0.62,0.75), bottom=(0.95,0.78,0.6), strength=1.2, rot=(radians(90),0,0))
    # greenery outside
    for i in range(12):
        r = random.Random(i)
        sphere(f'Bush{i}', r.uniform(0.5,1.1), (-4+i*0.85, D/2+2.2, 0.7+r.uniform(0,0.7)), foliage, seg=16, ring=10)
    # freestanding tub (oval, hollow)
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.95, depth=0.62, location=(0.2, D/2-1.55, 0.31))
    tub = bpy.context.object; tub.name='Tub'; tub.scale=(1.0,0.55,1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    outer = tub
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.86, depth=0.56, location=(0.2, D/2-1.55, 0.36))
    inner = bpy.context.object; inner.name='TubInner'; inner.scale=(1.0,0.55,1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = outer.modifiers.new('bool','BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=inner
    bpy.context.view_layer.objects.active = outer; bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(inner, do_unlink=True)
    outer.data.materials.append(stone)
    for p in outer.data.polygons: p.use_smooth = True
    # water
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.82, depth=0.02, location=(0.2, D/2-1.55, 0.45))
    wat = bpy.context.object; wat.scale=(1.0,0.55,1.0); bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    wat.data.materials.append(plain('Water', (0.4,0.55,0.52), 0.03, 0.1))
    # brass tub filler
    cyl('Filler', 0.025, 0.65, (1.15, D/2-0.75, 0.45), bronze, vertices=16)
    cyl('FillerArm', 0.02, 0.35, (1.05, D/2-0.9, 0.78), bronze, vertices=16, rot=(0,radians(90),0))
    # vanity
    cube('Vanity', (1.7, 0.6, 0.8), (-W/2+0.55, 1.9, 0.4), stone, bevel=0.01)
    cube('VanityTop', (1.85, 0.75, 0.05), (-W/2+0.55, 1.9, 0.82), marble, bevel=0.01)
    cyl('Basin', 0.24, 0.16, (-W/2+0.65, 1.9, 0.92), stone, vertices=40)
    cyl('Faucet', 0.02, 0.35, (-W/2+0.15, 1.9, 1.0), bronze, vertices=16)
    cube('Mirror', (0.05, 1.2, 1.5), (-W/2+0.1, 1.9, 1.85), plain('Mirror', (0.5,0.53,0.52), 0.05, 0.9))
    cube('MirrorFrame', (0.07, 1.3, 1.6), (-W/2+0.07, 1.9, 1.85), bronze)
    for zz in (1.2, 2.5):
        sphere('Sconce', 0.07, (-W/2+0.18, 1.9, zz), warm)
        point_light('SconceLight', (-W/2+0.35, 1.9, zz), 25, (1,0.7,0.4), 0.2)
    # towel + stool
    cube('Towel', (0.5, 0.05, 0.8), (-W/2+0.4, 3.0, 1.0), linen, bevel=0.02)
    cube('Stool', (0.5, 0.5, 0.45), (1.9, 2.9, 0.22), stone, bevel=0.03)
    # plant
    import_model('potted_plant_01', (2.2, 0.6, 0), scale=1.3)
    # lighting
    area_light('WindowKey', (0, D/2-0.6, 2.6), (0, 1.2, 1.0), 1100, (1.0,0.82,0.62), 3.2, 'RECTANGLE', 2.0)
    area_light('Fill', (-2.2, -2.2, 2.7), (0.2, 1.5, 0.9), 260, (0.8,0.87,1.0), 2.6)
    spot = bpy.data.lights.new('TubSpot','SPOT'); spot.energy=500; spot.color=(1,0.72,0.42); spot.spot_size=radians(50)
    spo = bpy.data.objects.new('TubSpot', spot); sc.collection.objects.link(spo); spo.location=(0.2, 1.4, 3.0); aim(spo,(0.2,2.0,0.4))
    camera((0, -3.15, 1.55), (0.1, 2.4, 1.1), 32)
    sc.render.filepath = os.path.join(OUT, 'interior_bath_preview.jpg' if preview else 'interior_bath.jpg')
    t=time.time(); bpy.ops.render.render(write_still=True); print('RENDERED bath', round(time.time()-t,1))

# -----------------------------------------------------------------------------
if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['all','preview']
    which = args[0] if args else 'all'
    preview = (args[1] if len(args)>1 else 'preview') == 'preview'
    fns = {'living': scene_living, 'dining': scene_dining, 'bedroom': scene_bedroom, 'bath': scene_bath}
    todo = fns if which == 'all' else {which: fns[which]}
    for name, fn in todo.items():
        fn(preview)
    print('DONE')

