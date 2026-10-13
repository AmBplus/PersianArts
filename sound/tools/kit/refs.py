import json,glob,os,collections,sys
BS=chr(92)
fs=glob.glob('media/film-versions/pencil-social/**/cues*.json',recursive=True)+glob.glob('media/film-versions/pencil-html/**/cues*.json',recursive=True)
fs=[f for f in fs if '_bench' not in f and '_lock' not in f and 'node_modules' not in f]
paths=collections.defaultdict(set)
def walk(o,f):
    if isinstance(o,dict):
        for v in o.values(): walk(v,f)
    elif isinstance(o,list):
        for v in o: walk(v,f)
    elif isinstance(o,str) and o.lower().endswith(('.mp3','.wav','.ogg','.opus','.flac','.m4a')):
        paths[o.replace(BS,'/')].add(f)
for f in fs:
    try: walk(json.load(open(f,encoding='utf8')),f)
    except Exception as e: print('ERR',f,e)
if __name__=='__main__':
    print(len(fs))
    for p in sorted(paths): print(os.path.exists(p), os.path.getsize(p)//1024 if os.path.exists(p) else '-', p, len(paths[p]))
    print(len(paths))
