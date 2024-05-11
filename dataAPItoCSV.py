import requests
from bs4 import BeautifulSoup
from selenium import webdriver
import time
import datetime
import json
import pandas as pd
import numpy as np
from selenium.webdriver.common.by import By

page=1
#원하는 지역 입력
region=""
#여기 인증키 입력
serviceKey=""
data_list = []
#최대 3개월 단위로 저장 
while page <= 11:
    response = requests.get("http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?stationName="+region+"&dataTerm=3month&pageNo="+str(page)+"&numOfRows=200&returnType=json&serviceKey="+serviceKey)
    json_ob=json.loads(response.content)
    data_item=json_ob['response']['body']['items']
    data_list.extend(data_item)
    page+=1
df = pd.DataFrame(data_list)
#결측치 제거
df= df.dropna(axis=1)
#날짜형변환 에러 해결 24:00 
df['dataTime'] = pd.to_datetime(df['dataTime'],errors="coerce")
df['dataTime'] = df['dataTime'].apply(lambda x: x.replace(hour=0) if x.hour == 24 else x)
#시간 데이터 그룹화해서 일단위로 정리
df.set_index('dataTime', inplace=True)
df = df.replace('-', np.nan).astype(float)
df = df.groupby(pd.Grouper(freq='D')).mean()
df= df.reset_index()