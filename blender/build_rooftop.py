import bpy, math, random, os, sys, time
from mathutils import Vector
from math import pi, sin, cos, radians

ROOT = r"D:\SARIT\NOVEXA- NoirDemons\cinematic flat website by deep seek"
OUT = os.path.join(ROOT, "public", "images")
PREVIEW = os.path.join(ROOT, "reference", "renders")
os.makedirs(OUT, exist_ok=True)
os.makedirs(PREVIEW, exist_ok=True)

FINAL = "--final" in sys.argv

# -----------------------------------------------------------------------------
# scene
# -----------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 72 if FINAL else 20
try:
    scene.eevee.use_raytracing = True
    scene.eevee.ray_tracing_options.use_denoise = True
    scene.eevee.ray_tracing_options.resolution_scale = '1'
except Exception as e:
    print('raytrace opts', e)
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality = 92
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -0.1
scene.render.film_transparent = False

col = bpy.data.collections.new("Rooftop")
scene.collection.children.link(col)

def link(obj):
    col.objects.link(obj)
    return obj

def new_mat(name, color, rough=0.5, metal=0.0, transmission=0.0, alpha=1.0,
            emission=None, emission_strength=0.0, noise=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission
    bsdf.inputs['Alpha'].default_value = alpha
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1)
        bsdf.inputs['Emission Strength'].default_value = emission_strength
    if noise:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = noise.get('scale', 20)
        tex.inputs['Detail'].default_value = 5
        bump = nt.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = noise.get('strength', 0.12)
        bump.inputs['Distance'].default_value = noise.get('distance', 0.02)
        nt.links.new(tex.outputs['Fac'], bump.inputs['Height'])
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
        mat.use_backface_culling = False
    return mat

# palette ---------------------------------------------------------------------
paving = new_mat('Paving', (0.46, 0.41, 0.33), 0.58, noise={'scale': 26, 'strength': 0.22, 'distance': 0.02})
# large-format travertine tiles for the roof deck
nt = paving.node_tree
bsdf = nt.nodes.get('Principled BSDF')
brick = nt.nodes.new('ShaderNodeTexBrick')
brick.offset = 0.5
brick.inputs['Scale'].default_value = 0.34
brick.inputs['Mortar Size'].default_value = 0.004
brick.inputs['Brick Width'].default_value = 0.62
brick.inputs['Row Height'].default_value = 0.34
brick.inputs['Color1'].default_value = (0.50, 0.45, 0.36, 1)
brick.inputs['Color2'].default_value = (0.43, 0.38, 0.30, 1)
brick.inputs['Mortar'].default_value = (0.22, 0.19, 0.15, 1)
coords = nt.nodes.new('ShaderNodeTexCoord')
nt.links.new(coords.outputs['Object'], brick.inputs['Vector'])
nt.links.new(brick.outputs['Color'], bsdf.inputs['Base Color'])
paving_edge = new_mat('PavingEdge', (0.70, 0.65, 0.55), 0.55, noise={'scale': 18, 'strength': 0.14, 'distance': 0.015})
stone = new_mat('Stone', (0.72, 0.66, 0.55), 0.6, noise={'scale': 12, 'strength': 0.18, 'distance': 0.02})
stone_dark = new_mat('StoneDark', (0.34, 0.31, 0.26), 0.72)
bronze = new_mat('Bronze', (0.30, 0.21, 0.12), 0.32, 0.92)
bronze_light = new_mat('BronzeLight', (0.50, 0.36, 0.21), 0.26, 0.9)
teak = new_mat('Teak', (0.32, 0.21, 0.12), 0.62, noise={'scale': 22, 'strength': 0.18, 'distance': 0.01})
linen = new_mat('Linen', (0.82, 0.78, 0.70), 0.86, noise={'scale': 40, 'strength': 0.16, 'distance': 0.01})
linen_warm = new_mat('LinenWarm', (0.68, 0.57, 0.43), 0.9)
water = new_mat('Water', (0.018, 0.065, 0.072), 0.025, 0.62, noise={'scale': 6, 'strength': 0.05, 'distance': 0.008})
pool_tile = new_mat('PoolTile', (0.035, 0.13, 0.125), 0.34)
glass = new_mat('Glass', (0.30, 0.36, 0.34), 0.05, 0.25, alpha=0.13)
glass_dark = new_mat('GlassDark', (0.12, 0.17, 0.17), 0.05, 0.4, alpha=0.35)
trunk = new_mat('Trunk', (0.24, 0.18, 0.11), 0.85, noise={'scale': 30, 'strength': 0.4, 'distance': 0.03})
foliage = new_mat('Foliage', (0.085, 0.15, 0.07), 0.66, noise={'scale': 9, 'strength': 0.22, 'distance': 0.02})
foliage_light = new_mat('FoliageLight', (0.19, 0.26, 0.10), 0.62)
olive = new_mat('Olive', (0.16, 0.20, 0.12), 0.8)
soil = new_mat('Soil', (0.10, 0.08, 0.055), 0.95)
lamp_glow = new_mat('LampGlow', (1.0, 0.78, 0.50), 0.5, emission=(1.0, 0.62, 0.32), emission_strength=9)
pool_glow = new_mat('PoolGlow', (1.0, 0.76, 0.48), 0.4, emission=(1.0, 0.66, 0.34), emission_strength=2.6)
city_far = new_mat('CityFar', (0.20, 0.24, 0.26), 0.85)
city_mid = new_mat('CityMid', (0.12, 0.14, 0.14), 0.9)
window_mat = new_mat('Window', (1.0, 0.72, 0.42), 0.5, emission=(1.0, 0.60, 0.30), emission_strength=3.2)
window_far = new_mat('WindowFar', (0.9, 0.75, 0.55), 0.5, emission=(1.0, 0.72, 0.44), emission_strength=2.2)
city_ground = new_mat('CityGround', (0.055, 0.062, 0.062), 0.95)
city_light = new_mat('CityLight', (1.0, 0.72, 0.4), 0.5, emission=(1.0, 0.64, 0.34), emission_strength=5.0)

# helpers ---------------------------------------------------------------------
def add_cube(name, size, loc, mat, bevel=0.0, rot=(0, 0, 0), parent=None):
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

def add_cyl(name, radius, depth, loc, mat, vertices=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(mat)
    return ob

def add_sphere(name, radius, loc, mat, subdiv=2, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=radius, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    ob.data.materials.append(mat)
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

# palms -----------------------------------------------------------------------
def make_palm(name, x, y, z, height=8.5, scale=1.0, seed=1):
    rnd = random.Random(seed)
    parts = []
    segs = 9
    for i in range(segs):
        t0, t1 = i/segs, (i+1)/segs
        z0, z1 = z + height*t0, z + height*t1
        bend = 0.55 * (t0**2)
        r0 = (0.18 - 0.085*t0) * scale
        r1 = (0.18 - 0.085*t1) * scale
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=r1, radius2=r0,
                                        depth=(z1-z0)*1.02,
                                        location=(x + bend*0.55, y + bend*0.15, (z0+z1)/2))
        ob = bpy.context.object
        ob.name = f"{name}_trunk_{i}"
        ob.data.materials.append(trunk)
        parts.append(ob)
    crown = Vector((x + 0.55*0.55, y + 0.15*0.55, z + height))
    leaves = []
    for f in range(12):
        ang = f/12 * 2*pi + rnd.uniform(-0.22, 0.22)
        L = (2.5 + rnd.uniform(-0.4, 0.7)) * scale
        lift = rnd.uniform(0.3, 0.85) * scale
        drop = rnd.uniform(0.8, 1.6) * scale
        spine = []
        for i in range(8):
            t = i/7
            rr = L*t
            hh = lift * sin(t*pi*0.9) - drop * (t**2)
            spine.append((crown.x + cos(ang)*rr, crown.y + sin(ang)*rr, crown.z + hh))
        for i in range(1, 7):
            t = i/7
            px, py, pz = spine[i]
            dirx, diry = cos(ang), sin(ang)
            side = Vector((-diry, dirx, 0))
            leaf_len = (0.75*(1-t)+0.16) * scale
            for s in (-1, 1):
                tip = Vector((px, py, pz)) + side*s*leaf_len + Vector((dirx*0.15, diry*0.15, -leaf_len*0.35))
                base = Vector((px, py, pz))
                mid = (base + tip)/2 + Vector((0, 0, 0.06))
                width = 0.105 * scale
                verts = [base + side*width*0.2, tip, mid + side*width, base]
                me = bpy.data.meshes.new(f"{name}_leaf_{f}_{i}_{s}")
                me.from_pydata([tuple(v) for v in verts], [], [(0, 1, 2, 3)])
                me.update()
                lob = bpy.data.objects.new(f"{name}_leaf_{f}_{i}_{s}", me)
                col.objects.link(lob)
                lob.data.materials.append(foliage if f % 3 else foliage_light)
                leaves.append(lob)
        verts = [(p[0], p[1], p[2]+0.01) for p in spine]
        me = bpy.data.meshes.new(f"{name}_spine_{f}")
        me.from_pydata(verts, [(i, i+1) for i in range(len(verts)-1)], [])
        me.update()
        lob = bpy.data.objects.new(f"{name}_spine_{f}", me)
        col.objects.link(lob)
        lob.data.materials.append(foliage)
        leaves.append(lob)
    merged = join_objects(parts + leaves, name)
    return merged

def hedge(name, x, y, z, w, h, seed=1):
    rnd = random.Random(seed)
    obs = []
    n = max(4, int(w / 0.55))
    for i in range(n):
        xx = x - w/2 + (i+0.5)*(w/n)
        rr = rnd.uniform(0.3, 0.46)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=rr,
                                             location=(xx, y + rnd.uniform(-0.1, 0.1),
                                                       z + h*0.5 + rnd.uniform(-0.04, 0.04)))
        ob = bpy.context.object
        ob.scale = (1.15, 1.0, h*0.9)
        ob.data.materials.append(foliage if i % 3 else foliage_light)
        obs.append(ob)
    return join_objects(obs, name)

# -----------------------------------------------------------------------------
# rooftop deck
# -----------------------------------------------------------------------------
DECK_Z = 0.0
POOL = dict(x0=-6.5, x1=9.5, y0=1.2, y1=10.6, depth=1.5)

# four slabs around the pool void
add_cube('DeckFront', (46, 14.2, 0.5), (0, -6.1, -0.25), paving, bevel=0.06)
add_cube('DeckBack', (46, 2.4, 0.5), (0, 11.8, -0.25), paving, bevel=0.06)
add_cube('DeckLeft', (16.5, 9.4, 0.5), (-14.75, 5.9, -0.25), paving, bevel=0.06)
add_cube('DeckRight', (13.5, 9.4, 0.5), (16.25, 5.9, -0.25), paving, bevel=0.06)
# deck edge fascia
add_cube('FasciaFront', (46, 0.22, 1.2), (0, -13.1, -0.6), stone_dark, bevel=0.04)
add_cube('FasciaLeft', (0.22, 26, 1.2), (-23.1, 0, -0.6), stone_dark, bevel=0.04)
add_cube('FasciaRight', (0.22, 26, 1.2), (23.1, 0, -0.6), stone_dark, bevel=0.04)

# pool basin
add_cube('PoolFloor', (16.2, 9.5, 0.25), (1.5, 5.9, -POOL['depth']), pool_tile)
add_cube('PoolWallW', (0.28, 9.5, POOL['depth']), (-6.44, 5.9, -POOL['depth']/2), pool_tile)
add_cube('PoolWallE', (0.28, 9.5, POOL['depth']), (9.44, 5.9, -POOL['depth']/2), pool_tile)
add_cube('PoolWallS', (16.2, 0.28, POOL['depth']), (1.5, 1.26, -POOL['depth']/2), pool_tile)
add_cube('PoolWallN', (16.2, 0.28, POOL['depth']), (1.5, 10.54, -POOL['depth']/2), pool_tile)
# coping
add_cube('CopingW', (0.55, 10.1, 0.14), (-6.65, 5.9, 0.05), paving_edge, bevel=0.03)
add_cube('CopingE', (0.55, 10.1, 0.14), (9.65, 5.9, 0.05), paving_edge, bevel=0.03)
add_cube('CopingS', (16.8, 0.55, 0.14), (1.5, 0.98, 0.05), paving_edge, bevel=0.03)
add_cube('CopingN', (16.8, 0.55, 0.14), (1.5, 10.82, 0.05), paving_edge, bevel=0.03)

# water + step shelf
add_cube('Water', (15.75, 9.1, 0.04), (1.5, 5.9, -0.10), water)
add_cube('PoolLEDW', (0.05, 9.0, 0.03), (-6.30, 5.9, 0.11), pool_glow)
add_cube('PoolLEDE', (0.05, 9.0, 0.03), (9.30, 5.9, 0.11), pool_glow)
add_cube('PoolLEDS', (15.3, 0.05, 0.03), (1.5, 1.36, 0.11), pool_glow)
add_cube('PoolLEDN', (15.3, 0.05, 0.03), (1.5, 10.44, 0.11), pool_glow)
add_cube('Shelf', (15.7, 2.0, 0.3), (1.5, 2.15, -0.30), pool_tile)
add_cube('ShelfLip', (15.7, 0.12, 0.12), (1.5, 3.16, -0.16), paving_edge)
# infinity edge spill
add_cube('Spill', (15.75, 0.16, 0.5), (1.5, 10.72, -0.18), water)

# steps down into pool at left
for i in range(3):
    add_cube(f'PoolStep{i}', (0.42, 2.2, 0.16), (-6.15 + i*0.45, 2.2, -0.32 - i*0.32), pool_tile, bevel=0.02)

# -----------------------------------------------------------------------------
# railings
# -----------------------------------------------------------------------------
def railing(prefix, x0, y0, x1, y1, h=1.08):
    length = math.hypot(x1-x0, y1-y0)
    n = max(2, int(length/2.4))
    for i in range(n+1):
        t = i/n
        x, y = x0+(x1-x0)*t, y0+(y1-y0)*t
        add_cube(f'{prefix}_post{i}', (0.06, 0.06, h), (x, y, h/2), bronze)
    add_cube(f'{prefix}_rail', (length, 0.07, 0.07), ((x0+x1)/2, (y0+y1)/2, h), bronze, rot=(0, 0, math.atan2(y1-y0, x1-x0)))
    # glass panel
    add_cube(f'{prefix}_glass', (length, 0.02, h-0.3), ((x0+x1)/2, (y0+y1)/2, (h-0.3)/2+0.1), glass)

railing('RailN', -22.6, 12.75, 22.6, 12.75)
railing('RailW', -22.6, 12.75, -22.6, 4.5)
railing('RailE', 22.6, 12.75, 22.6, 4.5)

# planters on the far edge
for i, (px, pw) in enumerate([(-19.6, 4.4), (19.6, 4.4)]):
    add_cube(f'EdgePlanter{i}', (pw, 1.1, 0.62), (px, 11.9, 0.31), stone, bevel=0.06)
    add_cube(f'EdgeSoil{i}', (pw-0.3, 0.8, 0.1), (px, 11.9, 0.64), soil)
    hedge(f'EdgeHedge{i}', px, 11.9, 0.66, pw-0.6, 0.55, seed=40+i)

# -----------------------------------------------------------------------------
# cabana / pergola (left)
# -----------------------------------------------------------------------------
CX, CY = -16.2, 4.6
add_cube('CabanaBase', (7.6, 7.2, 0.18), (CX, CY, 0.09), paving_edge, bevel=0.04)
for dx, dy in [(-3.55, -3.3), (3.55, -3.3), (-3.55, 3.3), (3.55, 3.3)]:
    add_cube(f'CabanaPost', (0.14, 0.14, 3.1), (CX+dx, CY+dy, 1.55), bronze)
add_cube('CabanaFrame', (7.7, 7.4, 0.14), (CX, CY, 3.15), bronze, bevel=0.02)
# slatted roof
for i in range(17):
    add_cube(f'Slat{i}', (7.5, 0.085, 0.10), (CX, CY-3.4+i*0.425, 3.28), teak)
# daybed
add_cube('DaybedBase', (3.5, 1.85, 0.34), (CX, CY+1.2, 0.32), teak, bevel=0.05)
add_cube('DaybedCushion', (3.35, 1.75, 0.22), (CX, CY+1.2, 0.60), linen, bevel=0.09)
for i, (dx, dy) in enumerate([(-1.1, 0.5), (0.0, 0.45), (1.1, 0.5)]):
    add_cube(f'Pillow{i}', (0.62, 0.24, 0.5), (CX+dx, CY+1.95, 0.82), linen_warm, bevel=0.08, rot=(radians(12), 0, 0))
# low table
add_cyl('CabanaTable', 0.62, 0.38, (CX+2.0, CY-1.4, 0.23), stone, vertices=40)
add_cyl('CabanaBowl', 0.22, 0.12, (CX+2.0, CY-1.4, 0.47), bronze_light, vertices=32)
# hanging lanterns
for i, dx in enumerate([-2.1, 2.1]):
    add_cyl(f'LanternRod{i}', 0.02, 1.1, (CX+dx, CY-0.4, 2.55), bronze, vertices=8)
    add_sphere(f'Lantern{i}', 0.22, (CX+dx, CY-0.4, 1.95), lamp_glow, subdiv=2, scale=(1, 1, 1.25))

# -----------------------------------------------------------------------------
# sun loungers (right)
# -----------------------------------------------------------------------------
def lounger(prefix, x, y, rot_z):
    grp = []
    # legs
    for dx in (-0.85, 0.85):
        for dy in (-0.28, 0.28):
            grp.append(add_cube(f'{prefix}_leg', (0.07, 0.07, 0.28), (x+dx*0.95, y+dy*0.95, 0.14), bronze, rot=(0, 0, rot_z)))
    grp.append(add_cube(f'{prefix}_frame', (2.05, 0.72, 0.1), (x, y, 0.33), teak, bevel=0.03, rot=(0, 0, rot_z)))
    grp.append(add_cube(f'{prefix}_cushion', (1.95, 0.66, 0.14), (x, y, 0.45), linen, bevel=0.06, rot=(0, 0, rot_z)))
    # backrest tilted
    bx = x - math.cos(rot_z)*0.75
    by = y - math.sin(rot_z)*0.75
    grp.append(add_cube(f'{prefix}_back', (0.78, 0.66, 0.12), (bx, by, 0.78), linen, bevel=0.06,
                        rot=(0, radians(-28), rot_z)))
    # towel
    grp.append(add_cube(f'{prefix}_towel', (0.55, 0.5, 0.035), (x+0.38, y, 0.535), linen_warm, bevel=0.01, rot=(0, 0, rot_z)))
    return grp

lounger('LoungeA', 12.9, 3.7, math.pi)
lounger('LoungeB', 16.1, 3.7, math.pi)
# side table between
add_cyl('LoungeTable', 0.38, 0.42, (14.5, 2.2, 0.21), stone, vertices=32)
add_cyl('LoungeCup', 0.055, 0.09, (14.5, 2.2, 0.47), bronze_light, vertices=16)

# umbrella
add_cyl('UmbPole', 0.05, 3.0, (19.6, 6.2, 1.5), bronze, vertices=12)
bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=2.2, radius2=0.08, depth=0.55, location=(19.6, 6.2, 3.05))
umb = bpy.context.object
umb.name = 'Umbrella'
umb.data.materials.append(linen)
add_cube('UmbShadow', (1.9, 1.9, 0.01), (18.9, 5.6, 0.02), paving_edge, rot=(0, 0, 0.4))

# -----------------------------------------------------------------------------
# planting
# -----------------------------------------------------------------------------
# planters with palms
for i, (px, py, ph, ps, seed) in enumerate([
    (-20.2, 0.2, 9.0, 1.05, 1),
    (-20.6, 10.5, 10.0, 1.12, 2),
    (20.3, 10.9, 9.4, 1.05, 3),
    (20.9, -0.6, 8.2, 0.96, 4),
    (12.2, -5.6, 9.6, 1.04, 5),
]):
    add_cube(f'PalmPlanter{i}', (3.1, 3.1, 0.72), (px, py, 0.36), stone, bevel=0.08)
    add_cube(f'PalmSoil{i}', (2.7, 2.7, 0.1), (px, py, 0.73), soil)
    make_palm(f'Palm{i}', px-0.1, py, 0.75, ph, ps, seed=seed)

# low olive trees near the cabana
for i, (px, py) in enumerate([(-21.0, 7.4), (-13.0, 10.9)]):
    add_cube(f'OlivePlanter{i}', (2.2, 2.2, 0.6), (px, py, 0.3), stone, bevel=0.06)
    add_cyl(f'OliveTrunk{i}', 0.14, 1.4, (px, py, 1.25), teak, vertices=12)
    for j in range(4):
        add_sphere(f'OliveCrown{i}_{j}', 0.8, (px + (j-1.5)*0.45, py + (j % 2)*0.35, 2.2 + (j % 3)*0.3),
                   olive if j % 2 else foliage, subdiv=2, scale=(1.1, 0.9, 0.8))

# hedges along the far edge (behind pool) and side
for i, (hx, hw) in enumerate([(-8.5, 5.4), (5.0, 7.0), (16.4, 6.0)]):
    add_cube(f'HedgePlanter{i}', (hw, 1.0, 0.55), (hx, 11.8, 0.275), stone, bevel=0.05)
    hedge(f'Hedge{i}', hx, 11.8, 0.53, hw-0.4, 0.75, seed=50+i)

# potted plants near the pool
for i, (px, py) in enumerate([(11.9, 10.4), (-8.3, 10.6), (11.7, -0.5)]):
    add_cyl(f'Pot{i}', 0.42, 0.7, (px, py, 0.35), stone, vertices=28)
    add_sphere(f'PotBush{i}', 0.55, (px, py, 1.0), foliage_light, subdiv=2, scale=(1, 1, 1.2))

# -----------------------------------------------------------------------------
# fire bowl
# -----------------------------------------------------------------------------
add_cyl('FireBowl', 0.8, 0.42, (11.9, 7.6, 0.21), stone_dark, vertices=40)
add_cyl('FireInner', 0.62, 0.06, (11.9, 7.6, 0.43), soil, vertices=40)
add_sphere('Flame', 0.4, (11.9, 7.6, 0.7), lamp_glow, subdiv=2, scale=(1, 1, 1.6))

# -----------------------------------------------------------------------------
# distant city
# -----------------------------------------------------------------------------
rnd = random.Random(91)
# dark ground carpet far below the roof
add_cube('CityGround', (6000, 6000, 2), (0, 1200, -43), city_ground)

# mid-rise city, hazy and warm, below the horizon
for i in range(110):
    x = rnd.uniform(-380, 380)
    y = rnd.uniform(180, 780)
    h = rnd.uniform(5, 22) * (1 + y/1300)
    w = rnd.uniform(5, 16)
    d = rnd.uniform(5, 16)
    b = add_cube(f'CityMid{i}', (w, d, h), (x, y, -42 + h/2), city_mid)
    if i % 4 == 0:
        for k in range(3):
            add_cube(f'MidWin{i}_{k}', (w*0.55, 0.08, 0.35),
                     (x, y-d/2-0.05, -42 + h*0.4 + k*h*0.16),
                     window_far)
    if i % 7 == 0:
        add_cube(f'MidCrown{i}', (w*0.5, d*0.5, 0.6), (x, y, -42 + h + 0.3), window_far)

# scattered city lights in the middle distance
for i in range(140):
    x = rnd.uniform(-420, 420)
    y = rnd.uniform(120, 950)
    s = rnd.uniform(0.25, 0.7)
    add_cube(f'CityDot{i}', (s, s, s), (x, y, -41.4), city_light)

# far towers
for i in range(64):
    x = rnd.uniform(-520, 520)
    y = rnd.uniform(950, 2600)
    h = rnd.uniform(26, 110) * (1 + (y-900)/2300)
    w = rnd.uniform(8, 22) * (1 + (y-900)/1900)
    d = rnd.uniform(8, 22) * (1 + (y-900)/1900)
    b = add_cube(f'CityFar{i}', (w, d, h), (x, y, -40 + h/2), city_far)
    # crown light
    add_cube(f'FarCrown{i}', (w*0.55, d*0.55, 1.0), (x, y, -40 + h + 0.5), window_far)
    if i % 2 == 0:
        for k in range(3):
            add_cube(f'FarWin{i}_{k}', (w*0.42, 0.08, 0.45),
                     (x, y-d/2-0.05, -40 + h*0.45 + k*h*0.15),
                     window_far)

# landmark supertall spire on the horizon
add_cube('LandmarkBase', (34, 34, 150), (210, 2600, -40+75), city_far)
add_cube('LandmarkMid', (20, 20, 82), (210, 2600, -40+150+41), city_far)
add_cube('LandmarkTop', (9, 9, 42), (210, 2600, -40+232+21), city_far)
add_cyl('LandmarkSpire', 1.4, 72, (210, 2600, -40+274+36), bronze, vertices=12)
add_cube('LandmarkCap', (6, 6, 3), (210, 2600, -40+276), window_far)

# second cluster, low and hazy on the left
for i in range(22):
    x = rnd.uniform(-900, -500)
    y = rnd.uniform(1800, 2600)
    h = rnd.uniform(30, 80)
    add_cube(f'FarWest{i}', (rnd.uniform(10, 22), rnd.uniform(10, 22), h), (x, y, -40+h/2), city_far)

# -----------------------------------------------------------------------------
# world + light
# -----------------------------------------------------------------------------
world = bpy.data.worlds.new('DuskWorld')
world.use_nodes = True
nt = world.node_tree
bg = nt.nodes.get('Background')
bg.inputs['Color'].default_value = (0.035, 0.055, 0.08, 1)
bg.inputs['Strength'].default_value = 0.3
scene.world = world

# gradient dusk dome -----------------------------------------------------------
dome_mat = bpy.data.materials.new('SkyDome')
dome_mat.use_nodes = True
dnt = dome_mat.node_tree
dnt.nodes.clear()
out = dnt.nodes.new('ShaderNodeOutputMaterial')
emit = dnt.nodes.new('ShaderNodeEmission')
ramp = dnt.nodes.new('ShaderNodeValToRGB')
coords = dnt.nodes.new('ShaderNodeTexCoord')
sep = dnt.nodes.new('ShaderNodeSeparateXYZ')
dnt.links.new(coords.outputs['Generated'], sep.inputs['Vector'])
dnt.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
dnt.links.new(ramp.outputs['Color'], emit.inputs['Color'])
dnt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
emit.inputs['Strength'].default_value = 1.0
stops = [
    (0.0, (0.04, 0.035, 0.03)),
    (0.48, (0.16, 0.12, 0.09)),
    (0.5, (1.0, 0.71, 0.45)),
    (0.515, (0.97, 0.64, 0.42)),
    (0.54, (0.76, 0.51, 0.44)),
    (0.58, (0.45, 0.39, 0.43)),
    (0.64, (0.23, 0.27, 0.35)),
    (0.72, (0.11, 0.16, 0.24)),
    (0.85, (0.04, 0.07, 0.12)),
    (1.0, (0.012, 0.025, 0.05)),
]
ramp.color_ramp.elements.remove(ramp.color_ramp.elements[1])
for pos, col in stops:
    el = ramp.color_ramp.elements[0] if pos == 0 else ramp.color_ramp.elements.new(pos)
    el.position = pos
    el.color = (*col, 1)

bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=6000, location=(0, 0, 0))
dome = bpy.context.object
dome.name = 'SkyDome'
dome.data.materials.append(dome_mat)
dome.visible_shadow = False

# a low sun smouldering behind the towers
sun_mat = new_mat('SunDisc', (1.0, 0.68, 0.36), 0.5, emission=(1.0, 0.58, 0.26), emission_strength=13)
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=58, location=(-2800, 3000, 92))
sun_disc = bpy.context.object
sun_disc.name = 'SunDisc'
sun_disc.data.materials.append(sun_mat)
sun_disc.visible_shadow = False

sun_data = bpy.data.lights.new('Sun', 'SUN')
sun_data.energy = 4.4
sun_data.color = (1.0, 0.58, 0.32)
sun_data.angle = radians(5)
sun = bpy.data.objects.new('Sun', sun_data)
scene.collection.objects.link(sun)
sun.location = (-2800, 3000, 92)
sun.rotation_euler = (Vector((0, 0, 8)) - sun.location).to_track_quat('-Z', 'Y').to_euler()

# warm fill from behind camera
area = bpy.data.lights.new('WarmFill', 'AREA')
area.energy = 380
area.shape = 'RECTANGLE'
area.size = 9
area.size_y = 5
area.color = (1.0, 0.72, 0.48)
ao = bpy.data.objects.new('WarmFill', area)
scene.collection.objects.link(ao)
ao.location = (9, -12, 12)
ao.rotation_euler = (Vector((1, 4, 1)) - ao.location).to_track_quat('-Z', 'Y').to_euler()

area2 = bpy.data.lights.new('CoolFill', 'AREA')
area2.energy = 220
area2.shape = 'RECTANGLE'
area2.size = 16
area2.size_y = 10
area2.color = (0.55, 0.72, 0.88)
ao2 = bpy.data.objects.new('CoolFill', area2)
scene.collection.objects.link(ao2)
ao2.location = (-18, 2, 20)
ao2.rotation_euler = (Vector((-8, 6, 0)) - ao2.location).to_track_quat('-Z', 'Y').to_euler()

# pool lights
for i, (px, py) in enumerate([(-3.0, 4.5), (5.5, 4.5), (1.5, 9.4)]):
    pl = bpy.data.lights.new(f'PoolLight{i}', 'POINT')
    pl.energy = 50
    pl.color = (0.30, 0.75, 0.78)
    pl.shadow_soft_size = 1.2
    po = bpy.data.objects.new(f'PoolLight{i}', pl)
    scene.collection.objects.link(po)
    po.location = (px, py, -0.4)

# cabana lanterns
for i, px in enumerate([-18.3, -14.1]):
    pl = bpy.data.lights.new(f'LanternLight{i}', 'POINT')
    pl.energy = 45
    pl.color = (1.0, 0.66, 0.36)
    pl.shadow_soft_size = 0.3
    po = bpy.data.objects.new(f'LanternLight{i}', pl)
    scene.collection.objects.link(po)
    po.location = (px, 4.2, 1.95)

# fire glow
pl = bpy.data.lights.new('FireLight', 'POINT')
pl.energy = 60
pl.color = (1.0, 0.45, 0.14)
pl.shadow_soft_size = 0.5
po = bpy.data.objects.new('FireLight', pl)
scene.collection.objects.link(po)
po.location = (11.9, 7.6, 0.9)

# -----------------------------------------------------------------------------
# camera + compositor
# -----------------------------------------------------------------------------
cam_data = bpy.data.cameras.new('RoofCam')
cam_data.lens = 30
cam_data.sensor_width = 36
cam_data.clip_start = 0.5
cam_data.clip_end = 14000
cam = bpy.data.objects.new('RoofCam', cam_data)
scene.collection.objects.link(cam)
cam.location = (17.5, -17.6, 6.8)
target = Vector((-2.2, 5.0, 2.4))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam

# bloom handled in the CSS layer for now (Blender 5 uses node groups)

# -----------------------------------------------------------------------------
# render
# -----------------------------------------------------------------------------
if FINAL:
    scene.render.resolution_x = 2200
    scene.render.resolution_y = 1375
    scene.eevee.taa_render_samples = 72
    scene.render.filepath = os.path.join(OUT, 'rooftop.jpg')
else:
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 750
    scene.eevee.taa_render_samples = 20
    scene.render.filepath = os.path.join(PREVIEW, 'rooftop_preview.jpg')

t0 = time.time()
bpy.ops.render.render(write_still=True)
print('RENDER_TIME', round(time.time()-t0, 1), 's ->', scene.render.filepath)
