import bpy, bmesh, math, random, os
from mathutils import Vector, Matrix
from math import pi, sin, cos, radians

random.seed(14)
ROOT = r"D:\SARIT\NOVEXA- NoirDemons\cinematic flat website by deep seek"
OUT = os.path.join(ROOT, "public", "images")
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(ROOT, "public", "models"), exist_ok=True)

# -----------------------------------------------------------------------------
# scene reset
# -----------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 64
try:
    scene.eevee.use_raytracing = True
    scene.eevee.ray_tracing_options.use_denoise = True
except Exception as e:
    print('raytracing setup skipped', e)

col = bpy.data.collections.new("Asterion")
scene.collection.children.link(col)

def link(obj, parent_col=None):
    (parent_col or col).objects.link(obj)
    return obj

def new_mat(name, color, rough=0.5, metal=0.0, transmission=0.0, alpha=1.0, emission=None, emission_strength=0.0, noise=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = transmission
    bsdf.inputs['Alpha'].default_value = alpha
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1)
        bsdf.inputs['Emission Strength'].default_value = emission_strength
    if noise:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = noise.get('scale', 20)
        tex.inputs['Detail'].default_value = 4
        bump = nt.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = noise.get('strength', 0.18)
        bump.inputs['Distance'].default_value = noise.get('distance', 0.03)
        nt.links.new(tex.outputs['Fac'], bump.inputs['Height'])
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
        mat.use_backface_culling = True
    return mat

stone = new_mat('Stone', (0.72, 0.66, 0.56), 0.62, noise={'scale': 16, 'strength': 0.22, 'distance': 0.04})
stone_light = new_mat('StoneLight', (0.82, 0.78, 0.69), 0.55, noise={'scale': 12, 'strength': 0.15, 'distance': 0.03})
stone_dark = new_mat('StoneDark', (0.38, 0.34, 0.28), 0.7)
concrete = new_mat('Concrete', (0.63, 0.60, 0.53), 0.8, noise={'scale': 24, 'strength': 0.35, 'distance': 0.05})
bronze = new_mat('Bronze', (0.31, 0.22, 0.13), 0.34, 0.9)
bronze_light = new_mat('BronzeLight', (0.55, 0.40, 0.24), 0.28, 0.85)
black_metal = new_mat('BlackMetal', (0.045, 0.045, 0.04), 0.3, 0.75)
glass = new_mat('Glass', (0.09, 0.13, 0.13), 0.06, 0.15, transmission=0.35, alpha=0.42)
glass_railing = new_mat('GlassRailing', (0.35, 0.40, 0.37), 0.06, 0.1, alpha=0.22)
glass_warm = new_mat('GlassWarm', (0.26, 0.22, 0.15), 0.08, 0.2, alpha=0.36)
dark_interior = new_mat('DarkInterior', (0.055, 0.05, 0.042), 0.8)
warm_light = new_mat('WarmLight', (1.0, 0.77, 0.48), 0.4, emission=(1.0, 0.62, 0.30), emission_strength=5)
soft_light = new_mat('SoftLight', (1.0, 0.86, 0.62), 0.5, emission=(1.0, 0.74, 0.42), emission_strength=1.4)
window_lit = new_mat('WindowLit', (1.0, 0.74, 0.42), 0.5, emission=(1.0, 0.56, 0.22), emission_strength=2.6)
foliage = new_mat('Foliage', (0.12, 0.20, 0.095), 0.62, noise={'scale': 9, 'strength': 0.2, 'distance': 0.02})
foliage_light = new_mat('FoliageLight', (0.26, 0.32, 0.14), 0.6)
trunk = new_mat('Trunk', (0.24, 0.18, 0.11), 0.85, noise={'scale': 30, 'strength': 0.4, 'distance': 0.05})
sand_mat = new_mat('Sand', (0.60, 0.52, 0.40), 0.9, noise={'scale': 10, 'strength': 0.12, 'distance': 0.02})
asphalt = new_mat('Asphalt', (0.055, 0.055, 0.052), 0.9, noise={'scale': 3, 'strength': 0.06, 'distance': 0.01})
paving = new_mat('Paving', (0.45, 0.42, 0.36), 0.7)
water = new_mat('Water', (0.08, 0.22, 0.24), 0.03, 0.2, alpha=0.75)
villa = new_mat('Villa', (0.74, 0.68, 0.58), 0.8)
villa_dark = new_mat('VillaDark', (0.32, 0.29, 0.24), 0.8)
skyline = new_mat('Skyline', (0.38, 0.43, 0.42), 0.75)

# helpers ---------------------------------------------------------------------
def add_cube(name, size, loc, mat, bevel=0.0, rot=(0,0,0), parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        md = ob.modifiers.new('bevel', 'BEVEL')
        md.width = bevel
        md.segments = 3
        bpy.ops.object.modifier_apply(modifier=md.name)
    ob.data.materials.append(mat)
    if parent:
        ob.parent = parent
    return ob

def add_cylinder(name, radius, depth, loc, mat, vertices=32, rot=(0,0,0), parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(mat)
    if parent:
        ob.parent = parent
    return ob

def rounded_rect_mesh(name, w, d, h, r, loc, mat, bevel=0.08, segments=5, parent=None):
    pts = []
    for cx, cy, a0 in [(-w/2+r, -d/2+r, pi), (w/2-r, -d/2+r, 1.5*pi), (w/2-r, d/2-r, 0), (-w/2+r, d/2-r, 0.5*pi)]:
        for i in range(segments+1):
            a = a0 + (pi/2) * i/segments
            pts.append((cx + r*cos(a), cy + r*sin(a)))
    me = bpy.data.meshes.new(name)
    me.from_pydata([(x,y,0) for x,y in pts], [], [list(range(len(pts)))])
    me.update()
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    ob.location = loc
    sol = ob.modifiers.new('solidify', 'SOLIDIFY')
    sol.thickness = h
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.modifier_apply(modifier=sol.name)
    if bevel > 0:
        md = ob.modifiers.new('bevel', 'BEVEL')
        md.width = bevel
        md.segments = 2
        bpy.ops.object.modifier_apply(modifier=md.name)
    ob.data.materials.append(mat)
    if parent:
        ob.parent = parent
    return ob

def empty(name, parent=None, loc=(0,0,0)):
    ob = bpy.data.objects.new(name, None)
    col.objects.link(ob)
    ob.empty_display_size = 1.5
    ob.location = loc
    if parent:
        ob.parent = parent
    return ob

def join_objects(objs, name):
    objs = [o for o in objs if o and o.name in bpy.data.objects]
    if not objs:
        return None
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.object
    ob.name = name
    return ob

# -----------------------------------------------------------------------------
# palms
# -----------------------------------------------------------------------------
def make_palm(name, x, y, z, height=10, scale=1.0, seed=1):
    rnd = random.Random(seed)
    parts = []
    # trunk as slightly tapered segments
    segs = 8
    for i in range(segs):
        t0, t1 = i/segs, (i+1)/segs
        z0, z1 = z + height*t0, z + height*t1
        bend = 0.55 * (t0**2)
        r0 = (0.19 - 0.09*t0) * scale
        r1 = (0.19 - 0.09*t1) * scale
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=r1, radius2=r0, depth=(z1-z0)*1.02, location=(x + bend*0.55, y + bend*0.15, (z0+z1)/2))
        ob = bpy.context.object
        ob.name = f"{name}_trunk_{i}"
        ob.data.materials.append(trunk)
        parts.append(ob)
    crown = Vector((x + 0.55*0.55, y + 0.15*0.55, z + height))
    leaves = []
    for f in range(13):
        ang = f/13 * 2*pi + rnd.uniform(-0.22, 0.22)
        L = (2.6 + rnd.uniform(-0.5, 0.8)) * scale
        lift = rnd.uniform(0.25, 0.8) * scale
        drop = rnd.uniform(0.85, 1.7) * scale
        spine = []
        for i in range(9):
            t = i/8
            rr = L*t
            hh = lift * sin(t*pi*0.9) - drop * (t**2)
            spine.append((crown.x + cos(ang)*rr, crown.y + sin(ang)*rr, crown.z + hh))
        # leaflet pairs
        for i in range(1, 8):
            t = i/8
            px, py, pz = spine[i]
            dirx, diry = cos(ang), sin(ang)
            side = Vector((-diry, dirx, 0))
            leaf_len = (0.78*(1-t)+0.16) * scale
            for s in (-1, 1):
                tip = Vector((px, py, pz)) + side*s*leaf_len + Vector((dirx*0.15, diry*0.15, -leaf_len*0.35))
                base = Vector((px, py, pz))
                mid = (base + tip)/2 + Vector((0,0,0.06))
                width = 0.11 * scale
                verts = [base + side*width*0.2, tip, mid + side*width, base]
                me = bpy.data.meshes.new(f"{name}_leaf_{f}_{i}_{s}")
                me.from_pydata([tuple(v) for v in verts], [], [(0,1,2,3)])
                me.update()
                lob = bpy.data.objects.new(f"{name}_leaf_{f}_{i}_{s}", me)
                col.objects.link(lob)
                lob.data.materials.append(foliage if f % 3 else foliage_light)
                leaves.append(lob)
        # central frond strip
        verts = [(p[0], p[1], p[2]+0.01) for p in spine]
        me = bpy.data.meshes.new(f"{name}_spine_{f}")
        me.from_pydata(verts, [(i, i+1) for i in range(len(verts)-1)], [])
        me.update()
        lob = bpy.data.objects.new(f"{name}_spine_{f}", me)
        col.objects.link(lob)
        lob.data.materials.append(foliage)
        leaves.append(lob)
    # dead hanging fronds
    for i in range(3):
        ang = rnd.uniform(0, 2*pi)
        L = 1.6*scale
        pts = []
        for j in range(6):
            t = j/5
            pts.append((crown.x + cos(ang)*L*t*0.5, crown.y + sin(ang)*L*t*0.5, crown.z - t*L*1.1))
        me = bpy.data.meshes.new(f"{name}_dead_{i}")
        me.from_pydata(pts, [(k,k+1) for k in range(len(pts)-1)], [])
        me.update()
        ob = bpy.data.objects.new(f"{name}_dead_{i}", me)
        col.objects.link(ob)
        ob.data.materials.append(trunk)
        leaves.append(ob)
    all_objs = parts + leaves
    merged = join_objects(all_objs, name)
    return merged

def hedge(name, x, y, z, w, d, h, seed=1):
    rnd = random.Random(seed)
    obs = []
    n = max(3, int(w / 0.7))
    for i in range(n):
        xx = x - w/2 + (i+0.5)*(w/n)
        rr = rnd.uniform(0.35, 0.55)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=rr, location=(xx, y + rnd.uniform(-0.2,0.2), z + h*0.45 + rnd.uniform(-0.06,0.06)))
        ob = bpy.context.object
        ob.scale = (1.15, 1.1, h*0.85)
        ob.data.materials.append(foliage if i%3 else foliage_light)
        obs.append(ob)
    return join_objects(obs, name)

# -----------------------------------------------------------------------------
# context
# -----------------------------------------------------------------------------
CTX = empty('CONTEXT')

# ground / roads
add_cube('Ground', (420, 420, 0.4), (0, 0, -0.2), sand_mat)
add_cube('Road', (420, 16, 0.08), (0, -34, 0.06), asphalt)
add_cube('RoadKerbNear', (420, 0.8, 0.28), (0, -25.6, 0.14), paving)
add_cube('RoadKerbFar', (420, 0.8, 0.28), (0, -42.4, 0.14), paving)
for i in range(-40, 41):
    add_cube(f'LaneMark{i}', (2.6, 0.12, 0.02), (i*5.2, -34, 0.115), stone_light, bevel=0.02)
# driveway / plaza
add_cube('Driveway', (12, 14, 0.1), (10, -19, 0.08), paving)
add_cube('Plaza', (58, 26, 0.12), (0, -12, 0.08), paving)
# side walk
add_cube('Sidewalk', (420, 4, 0.2), (0, -23.2, 0.1), stone_light)
for i in range(-18, 19):
    add_cube(f'PavingLine{i}', (0.06, 4, 0.01), (i*3.1, -23.2, 0.215), paving)

# low planter walls and hedges
for i, (x0, x1) in enumerate([(-28,-15),(-13,-4),(1,5),(18,28)]):
    w = x1-x0
    add_cube(f'PlanterWall{i}', (w, 1.4, 0.75), ((x0+x1)/2, -13.3, 0.38), stone_light, bevel=0.08)
    hedge(f'PlanterHedge{i}', (x0+x1)/2, -13.3, 0.78, w*0.9, 1.1, 0.65, seed=20+i)

# neighbor villas — low, distant, Dubais-style flat-roof houses among palms
for row in range(3):
    for i in range(14):
        x = -150 + i*23 + (row%2)*5
        y = 58 + row*30
        h = 4.2 + (i+row)%3*0.55
        b = add_cube(f'Villa_{row}_{i}', (9, 8, h), (x, y, h/2), villa, bevel=0.12)
        add_cube(f'VillaParapet_{row}_{i}', (9.4, 8.4, 0.28), (x, y, h+0.12), villa_dark, bevel=0.04)
        add_cube(f'VillaWindow_{row}_{i}', (3.6, 0.08, 1.2), (x, y-4.05, h*0.55), black_metal)
        if (i + row) % 4 == 0:
            make_palm(f'VillaPalm_{row}_{i}', x+6.5, y-3, 0, 7.0+(i%3), 0.62, seed=1200+i+row*11)
for i in range(10):
    x = -135 + i*30
    y = -115
    h = 5.4
    add_cube(f'VillaFront_{i}', (11, 9, h), (x, y, h/2), villa, bevel=0.1)
    add_cube(f'VillaFrontParapet_{i}', (11.4, 9.4, 0.28), (x, y, h+0.1), villa_dark)

# skyline
rnd = random.Random(5)
for i in range(34):
    x = rnd.uniform(-220, 220)
    y = rnd.uniform(180, 300)
    h = rnd.uniform(20, 95)
    w = rnd.uniform(10, 26)
    d = rnd.uniform(10, 24)
    add_cube(f'Skyline_{i}', (w, d, h), (x, y, h/2), skyline, bevel=0.2)

# street lights
for i in range(-8, 9):
    x = i*28
    add_cube(f'StreetLightPole{i}', (0.14, 0.14, 8), (x, -25, 4), black_metal)
    add_cube(f'StreetLightArm{i}', (2.6, 0.12, 0.12), (x+1.2, -25, 7.9), black_metal)
    add_cube(f'StreetLightGlow{i}', (0.7, 0.3, 0.14), (x+2.3, -25, 7.78), warm_light)

# palms
palm_positions = [
    (-31, -20, 0, 12, 1.05), (-24, -20, 0, 9, 0.9), (-17, -20, 0, 12.5, 1.0),
    (-8.5, -20, 0, 9.5, 0.9), (20, -20, 0, 11.5, 1.0), (28, -20, 0, 9.4, 0.9),
    (33, -20, 0, 12.2, 1.02), (-35, -20, 0, 8.4, 0.82), (16, -20, 0, 8.1, 0.78),
    (-20, -6, 13.1, 9.3, 0.8), (-8, -5, 13.1, 7.2, 0.65), (12, -5.5, 13.1, 8.1, 0.7),
    (22, -5.5, 13.1, 8.7, 0.76), (4, -4, 13.1, 6.2, 0.55),
]
palms = []
for i, (x, y, z, h, s) in enumerate(palm_positions):
    palms.append(make_palm(f'Palm_{i:02d}', x, y, z, h, s, seed=100+i))

# a car or two
for i,(cx,cy) in enumerate([(-26,-34),(24,-34)]):
    car = empty(f'Car_{i}', CTX, (cx,cy,0))
    add_cube(f'CarBody_{i}', (4.4,1.9,0.55), (0,0,0.55), black_metal, bevel=0.22, parent=car)
    add_cube(f'CarCabin_{i}', (2.2,1.65,0.48), (-0.15,0,1.02), glass, bevel=0.2, parent=car)
    for wx in (-1.45,1.35):
        for wy in (-0.92,0.92):
            add_cylinder(f'CarWheel_{i}_{wx}_{wy}', 0.34,0.22, (wx,wy,0.35), black_metal, vertices=20, rot=(pi/2,0,0), parent=car)

# -----------------------------------------------------------------------------
# podium
# -----------------------------------------------------------------------------
PODIUM = empty('PODIUM', loc=(0,0,0))
PW, PD, PH = 36, 23, 12.8

add_cube('podium_base', (PW, PD, 1.0), (0, 0, 0.5), stone_dark, bevel=0.12, parent=PODIUM)
# ground floor glass and stone piers
add_cube('podium_glass_front', (PW-4, 0.28, 4.6), (0, -PD/2+0.3, 3.1), glass, parent=PODIUM)
add_cube('podium_glass_left', (0.28, PD-4, 4.6), (-PW/2+0.3, 0, 3.1), glass, parent=PODIUM)
add_cube('podium_glass_right', (0.28, PD-4, 4.6), (PW/2-0.3, 0, 3.1), glass, parent=PODIUM)
for i in range(11):
    add_cube(f'podium_pier_{i}', (0.38, 0.5, 4.8), (-PW/2+2 + i*3.2, -PD/2-0.05, 3.0), stone_light, bevel=0.04, parent=PODIUM)
# warm lobby behind the glass
add_cube('lobby_backwall', (PW-7, 0.3, 4.5), (0, 5, 2.4), stone, parent=PODIUM)
add_cube('lobby_floor', (PW-5, PD-6, 0.1), (0, 0, 0.32), stone_light, parent=PODIUM)
add_cube('lobby_glow_front', (PW-7, 0.06, 3.3), (0, -2, 2.1), warm_light, parent=PODIUM)
add_cube('lobby_glow_left', (0.06, PD-8, 2.7), (-PW/2+1.0, 0, 2.0), soft_light, parent=PODIUM)
add_cube('lobby_glow_right', (0.06, PD-8, 2.7), (PW/2-1.0, 0, 2.0), soft_light, parent=PODIUM)
# reception desk
add_cube('reception_desk', (10, 2.2, 1.05), (-7, 2.0, 0.85), stone_dark, bevel=0.08, parent=PODIUM)
add_cube('reception_top', (10.4, 2.5, 0.07), (-7, 2.0, 1.4), bronze_light, bevel=0.02, parent=PODIUM)
# stone feature wall
add_cube('lobby_feature', (7, 0.4, 4.4), (5, 4.4, 2.5), stone, bevel=0.06, parent=PODIUM)
add_cube('lobby_feature_light', (5.5, 0.05, 3.0), (5, 4.17, 2.5), soft_light, parent=PODIUM)

# upper podium
add_cube('podium_mid', (PW, PD, 6.8), (0, 0, 8.8), stone, bevel=0.12, parent=PODIUM)
add_cube('podium_band', (PW+0.3, PD+0.3, 0.5), (0, 0, 12.25), stone_light, bevel=0.04, parent=PODIUM)
add_cube('podium_glass_upper', (PW-2.4, 0.1, 4.5), (0, -PD/2-0.02, 8.7), glass_warm, parent=PODIUM)
for i in range(8):
    add_cube(f'podium_upper_pier_{i}', (0.5, 0.4, 5.0), (-PW/2+3+i*4.5, -PD/2-0.05, 8.7), stone_light, bevel=0.04, parent=PODIUM)

# vertical fins (front + sides) - separate for animation
finsA, finsB = [], []
i = 0
x = -PW/2 + 1.0
while x < PW/2 - 1.0:
    depth = 0.55 + 0.22 * sin(x*0.55)
    ob = add_cube(f'podium_finA_{i}', (0.16, depth, 8.1), (x, -PD/2 - depth/2 - 0.02, 8.0), stone_light, bevel=0.02, parent=PODIUM)
    finsA.append(ob)
    i += 1
    x += 0.63
finsA = join_objects(finsA, 'podium_fins_front')
for side, sx in (('L', -1), ('R', 1)):
    fs = []
    for j in range(31):
        y = -PD/2 + 1.3 + j*0.66
        depth = 0.45 + 0.16*cos(y*0.9)
        ob = add_cube(f'podium_fin_{side}_{j}', (depth, 0.16, 8.1), (sx*(PW/2+depth/2-0.05), y, 8.0), stone_light, bevel=0.02, parent=PODIUM)
        fs.append(ob)
    finsB.append(join_objects(fs, f'podium_fins_{side}'))

# podium roof deck
add_cube('podium_roof', (PW+0.8, PD+0.8, 0.38), (0, 0, 13.1), stone_light, bevel=0.05, parent=PODIUM)
add_cube('podium_roof_plaza', (PW-2, PD-2, 0.08), (0, 0, 13.32), paving, parent=PODIUM)
# roof railings
add_cube('roof_rail_front', (PW, 0.05, 1.15), (0, -PD/2, 13.9), glass_railing, parent=PODIUM)
add_cube('roof_rail_top', (PW, 0.09, 0.06), (0, -PD/2, 14.48), bronze, parent=PODIUM)
# roof pergola
for i in range(6):
    add_cube(f'PergolaPost{i}', (0.16,0.16,3.1), (-14+i*2.2, -8.5, 15.0), bronze, parent=PODIUM)
add_cube('PergolaBeam', (12.8,0.22,0.22), (-8.7,-8.5,16.55), bronze, parent=PODIUM)
for i in range(9):
    add_cube(f'PergolaSlat{i}', (0.08, 0.24, 3.0), (-14.5+i*1.5, -8.5, 15.7), bronze, parent=PODIUM)
# roof pool hint
add_cube('RoofPool', (10, 5.6, 0.25), (12.2, 2.4, 13.4), water, bevel=0.05, parent=PODIUM)
add_cube('RoofPoolEdge', (10.8, 6.4, 0.16), (12.2, 2.4, 13.29), stone_light, bevel=0.04, parent=PODIUM)

# entrance canopy
ENT = empty('ENTRANCE', PODIUM, (9.5, -PD/2, 0))
add_cube('entrance_canopy', (10.6, 7.4, 0.65), (0, -2.2, 6.6), stone_light, bevel=0.08, parent=ENT)
add_cube('entrance_canopy_under', (10.0, 6.8, 0.08), (0, -2.2, 6.25), bronze_light, parent=ENT)
add_cube('entrance_portal_L', (1.1, 5.0, 6.2), (-5.2, -2.0, 3.2), bronze, bevel=0.04, parent=ENT)
add_cube('entrance_portal_R', (1.1, 5.0, 6.2), (5.2, -2.0, 3.2), bronze, bevel=0.04, parent=ENT)
add_cube('entrance_glass', (9.4, 0.16, 5.2), (0, -2.1, 3.0), glass_warm, parent=ENT)
add_cube('entrance_glow', (8.7, 0.05, 4.2), (0, -1.6, 2.8), warm_light, parent=ENT)
add_cube('entrance_step_1', (11.4, 7.6, 0.18), (0, -2.8, 0.18), stone_light, bevel=0.03, parent=ENT)
add_cube('entrance_step_2', (12.4, 8.6, 0.14), (0, -3.2, 0.07), paving, bevel=0.03, parent=ENT)
# awning detail
for i in range(6):
    add_cube(f'canopy_rib_{i}', (0.12, 6.4, 0.36), (-4.2+i*1.7, -2.4, 6.05), bronze_light, parent=ENT)

# podium wordmark (ASTERION) as geometry
try:
    fnt = bpy.data.fonts.load(r"C:\Windows\Fonts\georgia.ttf")
    bpy.ops.object.text_add(location=(-14.5, -PD/2-0.8, 8.9), rotation=(radians(90), 0, 0))
    txt = bpy.context.object
    txt.name = 'podium_logo'
    txt.data.body = 'ASTERION'
    txt.data.font = fnt
    txt.data.size = 1.55
    txt.data.space_character = 1.32
    txt.data.extrude = 0.025
    txt.data.bevel_depth = 0.005
    txt.data.align_x = 'LEFT'
    txt.data.materials.append(bronze_light)
    bpy.ops.object.convert(target='MESH')
    txt.parent = PODIUM
except Exception as e:
    print('logo skipped', e)

# landscape around base
for i, (x0,x1) in enumerate([(-17,-10),(-8,-4.5),(17,22),(23,29)]):
    hedge(f'BaseHedge{i}', (x0+x1)/2, -14.9, 0.2, (x1-x0)*0.9, 1.2, 0.6, seed=300+i)
for i in range(4):
    add_cube(f'Bollard{i}', (0.16,0.16,0.9), (-12+i*1.2, -16.2, 0.45), bronze, bevel=0.02)

# -----------------------------------------------------------------------------
# tower
# -----------------------------------------------------------------------------
TOWER = empty('TOWER', loc=(0,0,13.35))
FLOORS = 15
FH = 3.45
floor_shapes = [
    (17.6, 14.6, 0.35, -0.9, 1.7), (16.4, 15.3, -0.35, 0.25, 0.0),
    (16.8, 14.2, 0.4, 0.4, -1.3), (17.0, 15.0, -0.3, -0.2, 0.8),
    (16.2, 14.4, 0.15, -0.65, 1.2), (17.2, 14.9, 0.05, 0.1, -0.5),
    (16.6, 14.1, -0.4, 0.7, 1.4), (17.4, 15.2, 0.2, -0.3, -1.1),
    (16.3, 14.6, -0.25, 0.0, 0.5), (16.9, 14.0, 0.5, 0.55, 1.0),
    (17.1, 15.1, 0.0, -0.4, -0.8), (16.1, 14.3, -0.5, 0.65, 0.9),
    (16.7, 14.8, 0.3, -0.15, -0.6), (16.4, 14.2, -0.35, 0.4, 0.7),
    (17.0, 15.0, 0.1, -0.25, 0.2),
]

for f in range(FLOORS):
    z = f*FH
    grp = empty(f'L{f+1:02d}', TOWER, (0,0,z))
    w, d, dx, dy, wing = floor_shapes[f]
    slab_z = 0.0
    slab = rounded_rect_mesh(f'L{f+1:02d}_slab', w, d, 0.34, 1.35, (dx, dy, slab_z), stone_light, bevel=0.055, segments=7, parent=grp)
    # wing slab for the staggered silhouette
    if abs(wing) > 0.05:
        ww = 3.2 + abs(wing)*0.7
        sd = (1 if wing > 0 else -1)
        rounded_rect_mesh(f'L{f+1:02d}_wing', ww, d*0.52, 0.36, 0.95, (dx + sd*(w/2 + ww/2 - 1.0), dy + (0.8 if f%2 else -0.9), slab_z), stone_light, bevel=0.06, segments=6, parent=grp)
    # edge shadow
    add_cube(f'L{f+1:02d}_reveal', (w*0.94, d*0.94, 0.045), (dx, dy, -0.20), bronze, parent=grp)
    # glass volume and dark core
    add_cube(f'L{f+1:02d}_glass', (w-3.0, d-3.0, 2.85), (dx, dy, 1.9), glass, parent=grp)
    add_cube(f'L{f+1:02d}_core', (w-4.1, d-4.1, 2.7), (dx, dy, 1.9), dark_interior, parent=grp)
    # interior warm strips
    add_cube(f'L{f+1:02d}_warm', (w-4.5, d-4.5, 0.18), (dx, dy, 2.95), soft_light, parent=grp)
    # scattered warm-lit rooms behind the glass
    rnd_lit = random.Random(900 + f)
    lit_bays = rnd_lit.sample(range(2, int(w) - 3), k=min(5, int(w) - 5))
    for li, lb in enumerate(lit_bays):
        lw = 1.1 + (li % 3) * 0.45
        add_cube(f'L{f+1:02d}_lit_{li}', (lw, 0.08, 1.5 + (li % 2) * 0.35),
                 (dx - (w - 6) / 2 + lb * (w - 6) / (int(w) - 4), dy - d / 2 + 0.36, 1.35), window_lit, parent=grp)
    # balcony rail glass and posts
    rail_objs = []
    rail_spans = [
        ((w-1.0, 0.06, 1.05), (dx, dy-d/2+0.28, 1.15)),
        ((0.06, d-1.0, 1.05), (dx-w/2+0.28, dy, 1.15)),
        ((0.06, d-1.0, 1.05), (dx+w/2-0.28, dy, 1.15)),
    ]
    for span_i, (sz, loc) in enumerate(rail_spans):
        add_cube(f'L{f+1:02d}_rail_glass_{span_i}', sz, loc, glass_railing, parent=grp)
        add_cube(f'L{f+1:02d}_rail_top_{span_i}', (sz[0] if sz[0] > 0.2 else 0.09, 0.09 if sz[0] > 0.2 else sz[1], 0.06), (loc[0], loc[1], 1.68), bronze, parent=grp)
    # mullions and rail posts
    for i in range(int((w-2)/1.7)+1):
        xx = dx - (w-2)/2 + i*1.7
        add_cube(f'L{f+1:02d}_mul_f_{i}', (0.075, 0.09, 2.85), (xx, dy-d/2+1.45, 1.9), bronze, parent=grp)
    for i in range(int((d-2)/1.7)+1):
        yy = dy - (d-2)/2 + i*1.7
        add_cube(f'L{f+1:02d}_mul_s_{i}', (0.09, 0.075, 2.85), (dx-w/2+1.45, yy, 1.9), bronze, parent=grp)
    # planters every other floor
    if f % 3 == 1:
        pz = 0.35
        hedge(f'L{f+1:02d}_green', dx - w/2 + 3.2, dy + d/2 - 0.65, pz, 4.2, 0.8, 0.55, seed=500+f)
    # side bronze fins on some floors
    if f in (3,4,9,10,14):
        for i in range(7):
            add_cube(f'L{f+1:02d}_fin_{i}', (0.12, 0.32, 2.5), (dx + (w/2-0.35), dy - 3 + i*1.0, 1.9), bronze, parent=grp)

# crown
CROWN = empty('CROWN', TOWER, (0,0, FLOORS*FH))
rounded_rect_mesh('crown_slab', 17.4, 15.2, 0.55, 1.2, (0.1,-0.2,0), stone_light, bevel=0.06, parent=CROWN)
add_cube('crown_glass', (13.2, 11.3, 3.0), (0.1,-0.2,1.8), glass, parent=CROWN)
add_cube('crown_core', (12.0, 10.2, 2.8), (0.1,-0.2,1.8), dark_interior, parent=CROWN)
# roof crown frame
for i in range(9):
    add_cube(f'crown_bar_{i}', (0.12, 0.45, 2.2), (-7.6+i*1.9, -7.7, 4.9), bronze, parent=CROWN)
for i in range(8):
    add_cube(f'crown_top_{i}', (17.2, 0.12, 0.12), (0.1, -7.6+i*2.2, 6.0), bronze, parent=CROWN)
add_cube('crown_roof', (15.8, 13.8, 0.2), (0.1,-0.2,3.62), dark_interior, parent=CROWN)
add_cube('crown_beacon', (0.25,0.25,0.55), (6.2, -5.2, 6.2), warm_light, parent=CROWN)

# planting on crown + podium roof
for i, (x,y) in enumerate([(-15,-7.5),(-11,-7.5),(17,-7.5),(21,-7.5),(13,-8.5)]):
    make_palm(f'PalmRoof_{i}', x, y, 13.35, 6.2+0.7*i, 0.52, seed=800+i)

# standalone composition helper for renders: text footer plaques omitted

# -----------------------------------------------------------------------------
# world + lights
# -----------------------------------------------------------------------------
world = bpy.data.worlds.new('AsterionWorld')
scene.world = world
world.use_nodes = True
wn = world.node_tree
wn.nodes.clear()
world_out = wn.nodes.new('ShaderNodeOutputWorld')
bg = wn.nodes.new('ShaderNodeBackground')
sky = wn.nodes.new('ShaderNodeTexSky')
sky.sky_type = 'MULTIPLE_SCATTERING'
sky.sun_elevation = radians(2.4)
sky.sun_rotation = radians(104)
sky.air_density = 2.0
sky.aerosol_density = 3.6
sky.altitude = 620
sky.ozone_density = 0.5
bg.inputs['Color'].default_value = (0.55, 0.54, 0.50, 1)
bg.inputs['Strength'].default_value = 0.5
wn.links.new(sky.outputs['Color'], bg.inputs['Color'])
wn.links.new(bg.outputs['Background'], world_out.inputs['Surface'])

sun = bpy.data.lights.new('Sun', 'SUN')
sun.energy = 4.6
sun.color = (1.0, 0.63, 0.36)
sun_ob = bpy.data.objects.new('Sun', sun)
scene.collection.objects.link(sun_ob)
sun_ob.rotation_euler = (radians(84), 0, radians(18))

fill = bpy.data.lights.new('Fill', 'AREA')
fill.energy = 850
fill.size = 24
fill.color = (0.72, 0.83, 1.0)
fill_ob = bpy.data.objects.new('Fill', fill)
scene.collection.objects.link(fill_ob)
fill_ob.location = (-45, -55, 42)
fill_ob.rotation_euler = (radians(55), 0, radians(-35))

# warm uplights for entrance
for i, x in enumerate([3, 9.5, 16]):
    l = bpy.data.lights.new(f'EntranceGlow{i}', 'POINT')
    l.energy = 550
    l.color = (1.0, 0.64, 0.32)
    l.shadow_soft_size = 1.2
    lo = bpy.data.objects.new(f'EntranceGlow{i}', l)
    scene.collection.objects.link(lo)
    lo.location = (x, -17.0, 3.2)

# -----------------------------------------------------------------------------
# render helpers
# -----------------------------------------------------------------------------
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0.15
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'

def camera(name, loc, target, lens, ortho=None):
    cam = bpy.data.cameras.new(name)
    cam.lens = lens
    if ortho:
        cam.type = 'ORTHO'
        cam.ortho_scale = ortho
    ob = bpy.data.objects.new(name, cam)
    scene.collection.objects.link(ob)
    ob.location = loc
    direction = Vector(target) - Vector(loc)
    ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return ob

cam_hero = camera('Camera_Hero', (56, -112, 17), (0, 0, 34), 58)
cam_front = camera('Camera_Front', (0, -120, 20), (0, 0, 32), 60)
cam_entrance = camera('Camera_Entrance', (13.5, -31, 3.2), (6, -8, 5.4), 40)
cam_roof = camera('Camera_Roof', (-20, -16, 18.5), (8, -4, 22), 45)
cam_close = camera('Camera_Close', (16, -36, 8), (0, 0, 30), 70)

# -----------------------------------------------------------------------------
# save + export
# -----------------------------------------------------------------------------
for ob in bpy.context.selected_objects:
    ob.select_set(False)
# export everything except render-only context, cameras and lights
skip_prefixes = ('LaneMark','PavingLine','Villa','Skyline','StreetLight','Car','PlanterWall','PlanterHedge','BaseHedge','Bollard')
skip_names = {'Ground','Road','RoadKerbNear','RoadKerbFar','Driveway','Plaza','Sidewalk'}
export_objs = []
for o in scene.objects:
    if o.type not in ('MESH','EMPTY'):
        continue
    if o.name in skip_names or o.name.startswith(skip_prefixes):
        continue
    # never export anything parented beneath the CONTEXT empty
    p = o
    under_ctx = False
    while p:
        if p.name == 'CONTEXT':
            under_ctx = True
            break
        p = p.parent
    if under_ctx:
        continue
    export_objs.append(o)
    o.select_set(True)
bpy.context.view_layer.objects.active = export_objs[0] if export_objs else None
glb_path = os.path.join(ROOT, 'public', 'models', 'asterion.glb')
bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
print('EXPORTED', glb_path)

blend_path = os.path.join(ROOT, 'blender', 'asterion.blend')
os.makedirs(os.path.dirname(blend_path), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

# render stills (fast preview; final high-res can be re-run via renders.py)
def render(cam, name, w, h, samples=32):
    scene.camera = cam
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.eevee.taa_render_samples = samples
    scene.render.filepath = os.path.join(OUT, name + '.jpg')
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 92
    bpy.ops.render.render(write_still=True)
    print('RENDERED', name)

if os.environ.get('ASTERION_RENDER', '1') == '1':
    render(cam_hero, 'tower_hero', 1100, 1400, 24)
    render(cam_entrance, 'entrance', 1200, 800, 20)
    render(cam_roof, 'rooftop', 1200, 800, 20)
    render(cam_close, 'tower_close', 900, 1200, 20)
print('DONE')
