from flask import Blueprint, render_template, request, jsonify, send_file
import requests
import pandas as pd
import matplotlib.pyplot as plt
# import folium
import numpy as np
from dotenv import load_dotenv
import os, io
import mysql.connector
from datetime import datetime
# from openai import OpenAI


bp = Blueprint('main', __name__, template_folder='templates')

load_dotenv()
    
# 메인 페이지
@bp.route('/')
@bp.route('/page')
def index():
    # 데이터베이스 연결
    connection = connect_to_database()
    cursor = connection.cursor(dictionary=True)
    
    query = '''SELECT regionCode1, ROUND(AVG(pm10Value)) AS pm10Value
    FROM air_pollution_data
    WHERE dataTime = (
        SELECT MAX(dataTime)
        FROM air_pollution_data
        WHERE dataTime <= NOW()
        )
        GROUP BY regionCode1;'''
    addressQuery = '''SELECT khaiValue, pm10Value, pm25Value, o3Value, no2Value, coValue, so2Value, stationName
    FROM air_pollution_data
    WHERE dataTime = (
        SELECT MAX(dataTime)
        FROM air_pollution_data
        WHERE dataTime <= NOW()
        );'''
        
    askQuery = '''SELECT dataTime, ROUND(AVG(pm10Value)) AS pm10Value, ROUND(AVG(pm25Value)) AS pm25Value, ROUND(AVG(o3Value),4) AS o3Value, ROUND(AVG(no2Value),4) AS no2Value, ROUND(AVG(coValue),4) AS coValue, ROUND(AVG(so2Value),4) AS so2Value
    FROM air_pollution_data
    WHERE dataTime = (
        SELECT MAX(dataTime)
        FROM air_pollution_data
        WHERE dataTime <= NOW()
        )
	GROUP BY dataTime;'''
        
    try:
        # 데이터베이스에서 데이터 가져오기
        cursor.execute(query)
        current_data = cursor.fetchall()
            
        cursor.execute(addressQuery)
        address_data = cursor.fetchall()
        
        # cursor.execute(askQuery)
        # ask_data = cursor.fetchall()
        # msg = callback_gpt(ask_data)
        
    except Exception as e:
        # 오류 처리
        current_data = []
        print("Error:", e)
    finally:
        # 커넥션 및 커서 종료
        cursor.close()
        connection.close()
    return render_template('main.html', region_data=current_data,address_data=address_data)


# 소개 페이지
@bp.route('/introduce')
def introduve():
    return render_template('intro.html')


@bp.route('/view_data',methods=['GET', 'POST'])
def show_data():
    data_folder = os.path.join(os.path.dirname(__file__), 'static', 'data')

    csv_files = [f for f in os.listdir(data_folder) if f.endswith('.csv')]

    selected_file = csv_files[0]  # 기본값: 첫 번째 CSV 파일

    if request.method == 'POST':
        selected_file = request.form.get('csv_file')
        if selected_file not in csv_files:
            return "Invalid file selected", 400  # 잘못된 파일이 선택된 경우 오류 반환

    csv_file_path = os.path.join(data_folder, selected_file)
    #C:\Users\USER\Documents\GitHub\Capstone\app\module1\static\data\dataAPI20240510seoul.csv
    # 데이터 프레임으로 읽기
    df = pd.read_csv(csv_file_path, index_col=0)

    df = pd.read_csv(csv_file_path, index_col=0)

    df.set_index('dataTime')
    if request.method == 'POST':
        if 'transpose' in request.form:
             df = df.transpose()
        elif 'sort'  in request.form:
            df=df[::-1]
    # 데이터 프레임을 HTML 테이블로 변환
    data_html = df.to_html()

    return render_template('dataView.html', data_html=data_html,csv_files=csv_files, selected_file=selected_file)


# 미래 정보 예측 페이지
@bp.route('/predicts')
def predictions():
    return render_template('predicts.html')


# FAQ 페이지
@bp.route('/faq')
def FAQ():
    return render_template('faq.html')


def connect_to_database():
    return mysql.connector.connect(
        host='localhost',
        user='username',
        password='password',
        database='capstone',
        port=3306  # MySQL 포트
    )
    
@bp.route('/download_current', methods=['POST'])
def download_current():
    data_folder = os.path.join(os.path.dirname(__file__), 'static', 'data')
    selected_file="서울.csv"
    data_folder = os.path.join(os.path.dirname(__file__), 'static', 'data')
    selected_file = request.form.get('csv_file')

    if selected_file:
        csv_file_path = os.path.join(data_folder, selected_file)
        df = pd.read_csv(csv_file_path, skiprows=1)

        # 파일 변환 및 다운로드
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name=selected_file
        )

    return "Invalid request", 400