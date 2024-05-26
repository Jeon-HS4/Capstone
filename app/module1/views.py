from flask import Blueprint, render_template, request
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



# 메인 페이지
@bp.route('/page')
def page1():
    region_data = [
        {"region" : "부산", "pmValue": "30", "regionId" : "051"},
        {"region" : "충북", "pmValue": "110", "regionId" : "043"},
        {"region" : "충남", "pmValue": "150", "regionId" : "041"},
        {"region" : "대구", "pmValue": "120", "regionId" : "053"},
        {"region" : "경북", "pmValue": "20", "regionId" : "054"},
        {"region" : "경남", "pmValue": "110", "regionId" : "055"},
        {"region" : "광주", "pmValue": "70", "regionId" : "062 "},
        {"region" : "경기", "pmValue": "110", "regionId" : "031"},
        {"region" : "인천", "pmValue": "90", "regionId" : "032"},
        {"region" : "제주", "pmValue": "330", "regionId" : "064"},
        {"region" : "전북", "pmValue": "110", "regionId" : "063"},
        {"region" : "전남", "pmValue": "50", "regionId" : "061"},
        {"region" : "세종", "pmValue": "114", "regionId" : "044"},
        {"region" : "서울", "pmValue": "150", "regionId" : "02"},
        {"region" : "울산", "pmValue": "100", "regionId" : "052"},
        {"region" : "강원", "pmValue": "200", "regionId" : "033"},
        {"region" : "대전", "pmValue": "10", "regionId" : "042"},
    ]
    return render_template('main.html', region_data=region_data)


# 소개 페이지
@bp.route('/introduce')
def introduve():
    return render_template('intro.html')


# 데이터 확인 페이지
@bp.route('/view_data',methods=['GET', 'POST'])
def show_data():
    # src/data 폴더의 CSV 파일 경로 설정
    csv_file_path = os.path.join(os.path.dirname(__file__), 'static', 'data', 'dataAPI20240510seoul.csv')
    #C:\Users\USER\Documents\GitHub\Capstone\app\module1\static\data\dataAPI20240510seoul.csv
    # 데이터 프레임으로 읽기
    df = pd.read_csv(csv_file_path)
    df.set_index('dataTime')
    if request.method == 'POST':
        if 'transpose' in request.form:
             df = df.transpose()
        elif 'sort'  in request.form:
            df=df[::-1]

    # 데이터 프레임을 HTML 테이블로 변환
    data_html = df.to_html()

    return render_template('dataView.html', data_html=data_html)


# 미래 정보 예측 페이지
@bp.route('/predicts')
def predictions():
    return render_template('predicts.html')


# FAQ 페이지
@bp.route('/faq')
def FAQ():
    return render_template('faq.html')