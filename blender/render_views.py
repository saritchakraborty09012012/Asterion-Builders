import bpy, os, sys, time
from mathutils import Vector

ROOT = r"D:\SARIT\NOVEXA- NoirDemons\cinematic flat website by deep seek"
OUT = os.path.join(ROOT, "public", "images")
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "blender", "asterion.blend"))
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality = 90
scene.render.film_transparent = False
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0.45

# args: name camx camy camz tx ty tz lens w h samples
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
name, cx, cy, cz, tx, ty, tz, lens, w, h, samples = (
    args + ['preview', '39', '-72', '15', '0', '0', '35', '57', '600', '750', '8'])[:11]
cx, cy, cz, tx, ty, tz, lens, w, h, samples = map(float, (cx, cy, cz, tx, ty, tz, lens, w, h, samples))

cam = bpy.data.cameras.new('PreviewCam')
cam.lens = lens
cam_ob = bpy.data.objects.new('PreviewCam', cam)
scene.collection.objects.link(cam_ob)
cam_ob.location = (cx, cy, cz)
cam_ob.rotation_euler = (Vector((tx, ty, tz)) - Vector((cx, cy, cz))).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam_ob

scene.render.resolution_x = int(w)
scene.render.resolution_y = int(h)
scene.render.resolution_percentage = 100
scene.eevee.taa_render_samples = int(samples)
scene.render.filepath = os.path.join(OUT, name + '.jpg')
t0 = time.time()
bpy.ops.render.render(write_still=True)
print('RENDER_TIME', round(time.time() - t0, 1), 's ->', scene.render.filepath)
