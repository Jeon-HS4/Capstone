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
    
    
    return render_template('test.html')




@bp.route('/main')
def main_page():
    return render_template('main_page.html')

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

# @bp.route('/rcp')
# def rcp():
#     with open('example.asc', 'r') as file:
#         asc_content = file.read()
#     latitude = [37.7749, 34.0522] 
#     longitude = [-122.4194, -118.2437]  

#     # Folium 지도 생성
#     map = folium.Map(location=[latitude[0], longitude[0]], zoom_start=10)

#     # 데이터 포인트 추가
#     for lat, lon in zip(latitude, longitude):
#         folium.Marker([lat, lon]).add_to(map)

#     map.save('templates/map.html')
    
#     return render_template('map.html')
