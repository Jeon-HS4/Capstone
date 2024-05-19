from flask import Blueprint, render_template
import requests
import pandas as pd
import matplotlib.pyplot as plt
import base64
# import folium
import numpy as np
from io import BytesIO
from dotenv import load_dotenv
import os


bp = Blueprint('main', __name__, template_folder='templates')

load_dotenv()


@bp.route('/')
def index():
    data_path = r'C:\Users\dd946\Downloads\Capstone-main2\Capstone-main\시각화'
    current_loc = 'seoul' # 현재 위치로 설정
    main_data = pd.read_csv(f'{data_path}/dataAPI20240510{current_loc}.csv', index_col=False)
    region_data = [
        {"region" : "부산", "pmValue": "120"},
        {"region" : "충북", "pmValue": "110"},
        {"region" : "충남", "pmValue": "150"},
        {"region" : "대구", "pmValue": "120"},
        {"region" : "경북", "pmValue": "100"},
        {"region" : "경남", "pmValue": "110"},
        {"region" : "광주", "pmValue": "130"},
        {"region" : "경기", "pmValue": "110"},
        {"region" : "인천", "pmValue": "90"},
        {"region" : "제주", "pmValue": "120"},
        {"region" : "전북", "pmValue": "110"},
        {"region" : "전남", "pmValue": "120"},
        {"region" : "세종", "pmValue": "114"},
        {"region" : "서울", "pmValue": "150"},
        {"region" : "울산", "pmValue": "100"},   
    ]
    
    time_data = [
        {'year': 2022, 'data': [2, 3, 4, 5, 3, 4, 5, 6, 5, 4, 3, 2], 'color': '#B2EBF4'},
        {'year': 2023, 'data': [3, 4, 2, 5, 6, 7, 6, 5, 4, 3, 2, 1], 'color': '#FAED7D'},
        {'year': 2024, 'data': [4, 5, 3, 4, 5], 'color': '#FFAD7D'}
    ]
    
    return render_template('page.html', data=main_data, region_datas = region_data, time_datas = time_data)


@bp.route('/page')
def page1():
    return render_template('page.html')

@bp.route('/introduce')
def introduve():
    return render_template('introduce.html')



@bp.route('/main')
def main_page():
    return render_template('main_page.html')

@bp.route('/FAQ')
def FAQ():
    return render_template('FAQ.html')

@bp.route('/view_data')
def view_data():
    data = {
        'Name': ['Alice', 'Bob', 'Charlie'],
        'Age': [25, 30, 35],
        'City': ['New York', 'Los Angeles', 'Chicago']
    }
    df = pd.DataFrame(data)

    return render_template('view_data.html',  tables=[df.to_html(classes='data', header="true")])

@bp.route('/predicts')
def predictions():
    return render_template('predicts.html')

# @bp.route('/get_api')
def get_data():
    dec_key = os.environ.get('dec_key')
    url = 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty'
    params ={'serviceKey' : dec_key, 'returnType' : 'json', 'numOfRows' : '100', 'pageNo' : '1', 'stationName' : '종로구', 'dataTerm' : 'MONTH', 'ver' : '1.0' }
    response = requests.get(url, params=params)
    data = response.json()
    json_items = data['response']['body']['items']
    df = pd.json_normalize(json_items)
    df1 = df[['dataTime', 'so2Value', 'coValue', 'o3Value', 'no2Value', 'pm10Value', 'pm25Value', 'khaiValue']]
    df1.replace('-', np.nan, inplace=True)
    return df1

@bp.route('/visualize')
def visualize_data():
    df = get_data()
    data = {
        "labels": df['dataTime'].tolist(),
        "datasets": [{
            "label": column,
            "data": df[column].tolist()
        } for column in df.columns if column != 'dataTime']
    }
    return render_template('visualize.html', data=data)

