import json,os,re,subprocess,shutil,sys,collections
sys.path.insert(0,'sound/tools/kit')
from refs import paths as REFS
BS=chr(92)
KIT='sound/library/kit'
cat=json.load(open('sound/library/sfx/CATALOG.json',encoding='utf8'))['entries']
bypath={e['path']:e for e in cat}
def kid(e):
    stem=os.path.splitext(os.path.basename(e['path']))[0]
    s=e['source']
    if s=='freesound':
        m=re.match(r'(\d+)',stem); return 'fs-'+(m.group(1) if m else stem)
    if s=='kenney': return 'kn-'+stem
    if s=='owner-pack': return 'op-'+e['category']+'-'+stem
    return None
def probe(p):
    r=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration:stream=channels,sample_rate','-of','json',p],capture_output=True,text=True)
    j=json.loads(r.stdout); return float(j['format']['duration']),int(j['streams'][0]['channels']),int(j['streams'][0]['sample_rate'])
def peak(p):
    r=subprocess.run(['ffmpeg','-hide_banner','-i',p,'-af','volumedetect','-f','null','-'],capture_output=True,text=True)
    m=re.search(r'max_volume: (-?[\d.]+) dB',r.stderr); return float(m.group(1)) if m else None
def conv(src,dst,ch):
    os.makedirs(os.path.dirname(dst),exist_ok=True)
    subprocess.run(['ffmpeg','-y','-v','error','-i',src,'-vn','-c:a','libvorbis','-q:a','5',dst],check=True)
# selection
sel={}  # path -> reason
for p in REFS: sel[p]='cue'
CAP={'ambience':12.0,'riser':6.0,'downlifter':6.0,'swoosh-transition':6.0}
perc=collections.defaultdict(list)
for e in cat:
    if e['source']=='anidoodle' or e.get('preview_only') or not e.get('usable'): continue
    if e['path'] in sel: continue
    d=e['duration_s']; mx=CAP.get(e['category'],4.0)
    if not(0.15<=d<=mx) or e['peak_dbfs']<-18: continue
    if e.get('flags') and 'category_doubt' in e['flags'] and e['source']=='owner-pack' and e['category'] in('misc','stinger'): continue
    perc[e['category']].append(e)
TARGET=12
for c,lst in perc.items():
    have=sum(1 for p in sel if bypath.get(p,{}).get('category')==c)
    need=max(0,TARGET-have)
    # round robin by source, owner-pack first; within source prefer mid-range peaks / longer durations
    by=collections.defaultdict(list)
    for e in lst: by[e['source']].append(e)
    for s in by: by[s].sort(key=lambda e:(-(e['peak_dbfs']>-3 and 0 or 1), -abs(e['duration_s']-1.0)*-1))
    order=['owner-pack','freesound','kenney']
    pick=[]
    while len(pick)<need and any(by[s] for s in order):
        for s in order:
            if by[s] and len(pick)<need: pick.append(by[s].pop(0))
    for e in pick: sel[e['path']]='cat'
items=[]; manifest=[]; total=0
for p,why in sorted(sel.items()):
    e=bypath.get(p)
    if e is None:
        # not in catalog (premix)
        stem=os.path.splitext(os.path.basename(p))[0]
        e={'path':p,'source':'premix','category':'impact' if 'hit' in stem else 'misc','id':'premix:'+stem}
        k='pr-'+stem
    else: k=kid(e)
    if k is None or not os.path.exists(p): print('SKIP',p); continue
    ext=os.path.splitext(p)[1].lower(); sz=os.path.getsize(p)
    c=e['category']
    out_name=k+('.mp3' if ext=='.mp3' and sz<=600*1024 else '.ogg')
    dst=f'{KIT}/sfx/{c}/{out_name}'
    os.makedirs(os.path.dirname(dst),exist_ok=True)
    if out_name.endswith('.mp3') or (ext=='.ogg' and sz<=600*1024): shutil.copyfile(p,dst); how='copy'
    else:
        conv(p,dst,None); how='ogg-q5'
    if os.path.getsize(dst)>2*1024*1024: print('TOO BIG',dst)
    dur,ch,sr=probe(dst); pk=e.get('peak_dbfs'); 
    if pk is None: pk=peak(dst)
    total+=os.path.getsize(dst)
    items.append({'id':k,'category':c,'path':dst,'duration_s':round(dur,3),'peak_dbfs':pk,'channels':ch,'sample_rate':sr,'bytes':os.path.getsize(dst),'source':e['source'],'tags':[c,e['source']],'origin':why,'original_id':e.get('id'),'original_path':p,'licence':{'freesound':'CC (see sound/library/sfx/freesound/manifest.json)','kenney':'CC0','owner-pack':'owner pack (personal use)','premix':'derived from cue assets'}[e['source']],'doubt':bool(e.get('flags') and 'category_doubt' in e['flags']),'conversion':how})
    manifest.append({'id':k,'original_id':e.get('id'),'original_path':p,'kit_path':dst,'conversion':how,'orig_bytes':sz})
json.dump({'schema':'persianarts.sound_kit_catalog/1','count':len(items),'total_bytes':total,'entries':items},open(f'{KIT}/catalog.json','w',encoding='utf8'),indent=1,ensure_ascii=False)
json.dump({'schema':'persianarts.sound_kit_manifest/1','note':'maps original library ids/paths to kit ids and paths; cue sheets use original paths','entries':manifest},open(f'{KIT}/manifest.json','w',encoding='utf8'),indent=1,ensure_ascii=False)
print(len(items),total/1e6,'MB')
print(collections.Counter(i['category'] for i in items))
