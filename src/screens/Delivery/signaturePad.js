export const SIGNATURE_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>
  html,body{margin:0;height:100%;background:#fff}
  canvas{width:100%;height:100%;touch-action:none}
</style></head><body><canvas id="pad"></canvas><script>
const canvas = document.getElementById('pad');
const ctx = canvas.getContext('2d');
let empty = true;
let strokes = 0;
function resize(){
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, rect.width * 2);
  canvas.height = Math.max(1, rect.height * 2);
  ctx.setTransform(2,0,0,2,0,0);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#20243A';
}
resize();
let drawing = false;
function point(event){
  const touch = event.touches ? event.touches[0] : event;
  const rect = canvas.getBoundingClientRect();
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}
canvas.addEventListener('touchstart', (event) => {
  drawing = true;
  const p = point(event);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  event.preventDefault();
}, {passive:false});
canvas.addEventListener('touchmove', (event) => {
  if (!drawing) return;
  const p = point(event);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  empty = false;
  event.preventDefault();
}, {passive:false});
canvas.addEventListener('touchend', () => { if (!empty) strokes += 1; drawing = false; });
window.saveSignature = function(){
  window.ReactNativeWebView.postMessage(JSON.stringify({
    ok: !empty && strokes > 0,
    strokes,
    data: empty ? '' : canvas.toDataURL('image/png')
  }));
};
window.clearSignature = function(){ empty = true; strokes = 0; resize(); };
</script></body></html>`;
