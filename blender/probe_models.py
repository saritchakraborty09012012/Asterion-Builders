import bpy, os
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
root = r"D:\SARIT\NOVEXA- NoirDemons\cinematic flat website by deep seek\reference\source\models"
for name in ["Sofa_01","modern_arm_chair_01","CoffeeTable_01","dining_table","dining_chair_02","potted_plant_01","pachira_aquatica_01","modern_ceiling_lamp_01","throw_pillows_01","bull_head","outdoor_table_chair_set_01","stone_fire_pit","side_table_01","ornate_mirror_01"]:
    f = os.path.join(root, name, name + ".gltf")
    if not os.path.exists(f):
        print("MISSING", name); continue
    before = set(bpy.data.objects)
    try:
        bpy.ops.import_scene.gltf(filepath=f)
    except Exception as e:
        print("FAIL", name, e); continue
    new = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    if not new:
        print("NO MESH", name); continue
    mn = Vector((1e9,1e9,1e9)); mx = Vector((-1e9,-1e9,-1e9))
    for o in new:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            mn = Vector((min(mn.x,w.x),min(mn.y,w.y),min(mn.z,w.z)))
            mx = Vector((max(mx.x,w.x),max(mx.y,w.y),max(mx.z,w.z)))
    print(f"{name}: size=({mx.x-mn.x:.2f},{mx.y-mn.y:.2f},{mx.z-mn.z:.2f}) min=({mn.x:.2f},{mn.y:.2f},{mn.z:.2f}) max=({mx.x:.2f},{mx.y:.2f},{mx.z:.2f})")
