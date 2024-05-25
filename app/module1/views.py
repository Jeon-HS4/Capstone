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
    connection = connect_to_database()
    cursor = connection.cursor(dictionary=True)

    text1 = '''
    1. PM10 ³g/mµ\n
    - 이 정도는 중간 수준입니다. 이 정도 농도라면 대기질은 괜찮지만, 대기오염에 유난히 민감한 사람들에게는 우려가 있을 수 있습니다.

    2. PM2.5 ³ g/m µ\n
    - 민감한 집단에게는 건강에 좋지 않을 수 있는 수준으로 간주됩니다. 호흡기 질환이나 심장 질환이 있는 사람, 어린이, 노인은 건강에 영향을 받을 수 있습니다. 일반 대중은 영향을 받지 않을 것입니다.

    3. O3 (Ozone): 0.022 ppm\n
    - 이것은 상대적으로 낮은 수준의 오존입니다. 이 농도에서는 일반인의 건강에 영향을 미치지 않습니다. 

    4. CO(일산화탄소) : 0.3ppm\n
    - 이것은 낮은 수준이며 일반적으로 정상적인 상황에서는 건강에 위험을 주지 않습니다.

    5. SO2(이산화황) : 0.003ppm\n
    - 이것은 또한 낮은 수준이며 일반적으로 대부분의 사람들에게 관심사가 아닙니다.
    '''

    text2 = '''
    - 여기서 가장 우려되는 것은 민감한 집단에게 잠재적으로 건강에 좋지 않을 수 있을 만큼 충분히 높은 PM2.5의 수준입니다. 호흡기 질환이 있는 사람, 노인 및 어린이와 같은 민감한 개인에게는 장시간의 야외 활동을 제한하는 것이 바람직할 수 있습니다.
    - PM10, O3, CO, SO2의 수준은 일반적으로 허용 가능하며 일반 인구에게 건강에 악영향을 미치지 않을 것으로 예상됩니다.
    '''
    text3 = '''
    - 일반인의 경우 대기질은 보통 수준으로 야외 활동은 평소와 다름없이 지속될 수 있습니다.
    - 민감한 집단의 경우 공기질이 개선될 때까지 실내에 머물거나 공기청정기를 사용하고 격렬한 야외활동을 피하는 등의 주의를 기울이는 것이 좋습니다.
    '''


    try:
        # 데이터베이스에서 데이터 가져오기
        cursor.execute("SELECT * FROM region_data")
        region_data = cursor.fetchall()
    except Exception as e:
        # 오류 처리
        region_data = []
        print("Error:", e)
    finally:
        # 커넥션 및 커서 종료
        cursor.close()
        connection.close()
    return render_template('main.html', region_data=region_data, text1 = text1, text2 = text2, text3=text3)


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