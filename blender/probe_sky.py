import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
w = bpy.data.worlds.new("W"); w.use_nodes=True
nt=w.node_tree
sky=nt.nodes.new("ShaderNodeTexSky")
print([p.identifier for p in sky.bl_rna.properties])
for t in ("SINGLE_SCATTERING","MULTIPLE_SCATTERING","PREETHAM","HOSEK_WILKIE"):
    try:
        sky.sky_type=t
        print(t, [p.identifier for p in sky.bl_rna.properties if p.identifier not in ("rna_type","location","width","height","name","label","inputs","outputs","internal_links","parent","select","show_options","show_preview","hide","mute","show_texture","bl_idname","bl_label","bl_description","bl_icon","bl_static_type","bl_width_default","bl_width_min","bl_width_max","bl_height_default","bl_height_min","bl_height_max")])
    except Exception as e:
        print(t, e)
