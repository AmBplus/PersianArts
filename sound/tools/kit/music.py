import json,os,subprocess,sys
KIT='sound/library/kit/music'; os.makedirs(KIT,exist_ok=True)
PY=os.path.abspath('sound/.venv/Scripts/python.exe')
O='media/music-staging/owner/'
T=[
 ('lnplus-597024',O+'lnplusmusic-background-background-music-597024.mp3',O+'lnplusmusic-background-background-music-597024.mp3.source.json',110.0,['background','corporate','steady','upbeat'],'Pixabay-style owner download (LNPLUS Music)'),
 ('dogo-jump-1267515','media/music-staging/jamendo/dogo-jump-1267515.mp3','media/music-staging/jamendo/dogo-jump-1267515.source.json',119.6,['house','happy','marimba','bright'],'Jamendo'),
 ('miromax-promo-513944',O+'miromaxmusic-music-promotion-513944.mp3',O+'miromaxmusic-music-promotion-513944.mp3.source.json',118.0,['promo','underscore','clean'],'Pixabay-style owner download (MiroMax Music)'),
 ('px-99s-d',O+'px-99s-d.mp3',O+'px-99s-d.mp3.source.json',118.0,['bright','id-only','unknown-mood'],'owner download, unnamed ID-only file'),
 ('the-mountain-epic-610137',O+'the-mountain-epic-610137.mp3',O+'the-mountain-epic-610137.mp3.source.json',110.0,['epic','cinematic','light'],'Pixabay-style owner download (The Mountain)'),
 ('bgm-tech-house','sound/library/bgm/bgm-tech-house.mp3','sound/library/bgm/bgm-tech-house.music.json',124.0,['tech-house','driving'],'sound/library/bgm'),
 ('house-vibez','sound/library/bgm/house-vibez.mp3','sound/library/bgm/house-vibez.music.json',122.0,['house','groove'],'sound/library/bgm'),
]
TR=[]
for slug,src,srcjson,bpm,tags,origin in T:
    dst=f'{KIT}/{slug}.ogg'
    subprocess.run(['ffmpeg','-y','-v','error','-i',src,'-t','90','-vn','-c:a','libvorbis','-b:a','112k',dst],check=True)
    tmp=f'sound/tools/kit/{slug}.mm.json'
    r=subprocess.run([PY,'-I','sound/tools/music_map.py',dst,'--out',tmp],capture_output=True,text=True)
    if r.returncode: print(slug,'MM FAIL',r.stderr[-300:]); continue
    mm=json.load(open(tmp,encoding='utf8'))
    try: so=json.load(open(srcjson,encoding='utf8'))
    except Exception: so={}
    orig=None
    for c in (src+'.music.json', src.rsplit('.',1)[0]+'.music.json'):
        if os.path.exists(c): orig=json.load(open(c,encoding='utf8')); break
    dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',dst],capture_output=True,text=True).stdout)
    kit={'id':'tr-'+slug,'file':f'{slug}.ogg','excerpt':{'source_start_s':0.0,'source_end_s':round(min(90.0,orig['duration_s'] if orig else 90.0),3),'note':'excerpt starts at source 0.0 s, so beat grid and T0 of the source stay valid; bars/beats/downbeats counted from T0','source_duration_s':orig['duration_s'] if orig else None},
      'source_grid':{'bpm':orig and orig['bpm'],'t0':orig and orig['t0'],'verdict':orig and orig.get('grid',{}).get('verdict')},
      'excerpt_grid':{'bpm':mm['bpm'],'t0':mm['t0'],'verdict':mm.get('grid',{}).get('verdict'),'beat_s':mm['beat_s'],'beats_per_bar':mm['beats_per_bar'],'bar_s':mm['bar_s'],'n_bars':mm['n_bars']},
      'duration_s':round(dur,3),'bytes':os.path.getsize(dst),'mood_tags':tags,'origin':origin,
      'source_info':{k:so.get(k) for k in ('track_id','name','artist','page_url','licence','licence_url','attribution_required','credit_line','original_name','original_path','sha1','sha256','downloaded_utc','file') if k in so},
      'licence_note':'personal use (owner decision); keep credit_line where a licence requires attribution',
      'original_staged_path':src}
    mm['kit']=kit
    json.dump(mm,open(f'{KIT}/{slug}.music.json','w',encoding='utf8'),indent=1,ensure_ascii=False)
    TR.append({'id':'tr-'+slug,'path':f'{KIT}/{slug}.ogg','duration_s':kit['duration_s'],'bytes':kit['bytes'],'source_bpm':kit['source_grid']['bpm'],'source_t0':kit['source_grid']['t0'],'excerpt_bpm':mm['bpm'],'excerpt_t0':mm['t0'],'verdict':kit['excerpt_grid']['verdict']})
    print(slug,kit['bytes']//1024,'KB','src',kit['source_grid']['bpm'],kit['source_grid']['t0'],'ex',mm['bpm'],mm['t0'],kit['excerpt_grid']['verdict'])
json.dump(TR,open('sound/tools/kit/tracks.json','w'),indent=1)
