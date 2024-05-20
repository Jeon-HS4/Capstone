from flask import Blueprint, render_template, request
import requests
import pandas as pd
import matplotlib.pyplot as plt
# import folium
import numpy as np
from dotenv import load_dotenv
import os
import mysql.connector


bp = Blueprint('main', __name__, template_folder='templates')

load_dotenv()



# 메인 페이지
@bp.route('/')
@bp.route('/page')
def page1():
    # 데이터베이스 연결
    #connection = connect_to_database()
    #cursor = connection.cursor(dictionary=True)

    #try:
        # 데이터베이스에서 데이터 가져오기
        #cursor.execute("SELECT * FROM region_data")
        #region_data = cursor.fetchall()
   # except Exception as e:
        # 오류 처리
        #region_data = []
        #print("Error:", e)
    #finally:
        # 커넥션 및 커서 종료
        #cursor.close()
        #connection.close()
    return render_template('main.html', region_data=[])


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


def connect_to_database():
    return mysql.connector.connect(
        host='localhost',
        user='username',
        password='password',
        database='capstone',
        port=3306  # MySQL 포트
    )