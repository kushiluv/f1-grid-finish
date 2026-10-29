"""Prepare a few sourced race-control milestones; leave lap-end ranks unchanged."""
from pathlib import Path
import json

FIA='https://www.fia.com/news/f1-vestappen-takes-stunning-sao-paulo-win-p17-grid-alpine-score-double-podium'
OPENF1='https://api.openf1.org/v1/race_control?session_key=9636'

def build_control_events(raw_file):
    messages=json.loads(Path(raw_file).read_text())
    def recorded(lap, message, kind, label, title, description, end=None):
        records=[r for r in messages if r['lap_number']==lap and r['message']==message]
        assert len(records)==1,(lap,message)
        event={'lap':lap,'kind':kind,'label':label,'title':title,'description':description,'utc':records[0]['date'],'source':OPENF1,'message':message}
        if end is not None:event['band_end_lap']=end
        return event
    assert any(r['lap_number']==42 and r['message']=='SAFETY CAR IN THIS LAP' for r in messages)
    return [
        {'lap':0,'kind':'wet','label':'WET RACE','title':'A wet start','description':'Rain made grip and pit timing important alongside starting position.','source':FIA},
        recorded(28,'VIRTUAL SAFETY CAR DEPLOYED','vsc','VSC','Virtual safety car','Hülkenberg stopped. The virtual safety car slowed the field; pit timing began to reshape the order.',29),
        recorded(30,'SAFETY CAR DEPLOYED','safety-car','SAFETY CAR','Safety car in heavy rain','Worsening rain brought out the safety car. Drivers followed it at reduced speed.',32),
        recorded(32,'RED FLAG','red','RED FLAG','The race is suspended','Colapinto crashed and the race was stopped. Ocon was ahead of Verstappen after the earlier pit-stop sequence.',33),
        {'lap':33,'kind':'restart','label':'RESTART ORDER','title':'After the red flag','description':'The red-flag stoppage followed a safety car in heavy rain and Colapinto’s crash.','source':FIA},
        recorded(39,'SAFETY CAR DEPLOYED','safety-car','SAFETY CAR','Another safety car','Sainz’s crash brought out another safety car, bunching the field before the next restart.',43),
        {'lap':43,'kind':'restart','label':'RACING RESUMES','title':'A restart changes the lead','description':'The safety car returned after Sainz’s crash; it came in at the end of lap 42.','source':FIA},
        recorded(69,'CHEQUERED FLAG','finish','FINISH','Chequered flag','The wet race ends after 69 laps.'),
    ]

if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    target=root/'public/data/race_case.json'
    race=json.loads(target.read_text())
    race['control_events']=build_control_events(root.parent/'f1_dashboard_plan/data/openf1/race_control_9636.json')
    if not any(s['url']==OPENF1 for s in race['sources']):race['sources'].append({'title':'OpenF1 race-control messages','url':OPENF1})
    target.write_text(json.dumps(race,ensure_ascii=False,separators=(',',':')))
    print('Prepared',len(race['control_events']),'race-control milestones; original rank traces retained.')
