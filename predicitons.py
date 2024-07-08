import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error

def main():
    # 데이터 로드
    fine_dust_path = 'app/module1/static/data/미세먼지.csv'  # 미세먼지 데이터 파일 경로
    temperature_path = 'app/module1/static/data/기온.csv'    # 기온 데이터 파일 경로

    fine_dust_df = pd.read_csv(fine_dust_path)
    temperature_df = pd.read_csv(temperature_path)

    # 데이터 전처리
    fine_dust_df = fine_dust_df.iloc[3:]
    fine_dust_df.columns = ['날짜', 'PM10', 'PM2.5', '오존', '이산화질소', '일산화탄소', '아황산가스', '최종확정여부']
    fine_dust_df = fine_dust_df.drop(columns=['최종확정여부'])
    fine_dust_df['날짜'] = pd.to_datetime(fine_dust_df['날짜'])

    temperature_df.columns = ['시점', '기온', '강수량', '상대습도', '평균운량', '일조시간', '바람']
    temperature_df['시점'] = pd.to_datetime(temperature_df['시점'], format='%Y. %m')

    # 병합
    merged_df = pd.merge(fine_dust_df, temperature_df, left_on='날짜', right_on='시점', how='inner')
    merged_df = merged_df.drop(columns=['시점'])

    # 결측값 처리
    merged_df = merged_df.fillna(merged_df.mean())

    # 예측할 대상 변수와 입력 변수 선택
    target_columns = ['PM10', 'PM2.5', '오존']
    feature_columns = merged_df.columns.difference(target_columns + ['날짜'])

    X = merged_df[feature_columns]
    y_pm10 = merged_df['PM10']
    y_pm25 = merged_df['PM2.5']
    y_ozone = merged_df['오존']

    # 데이터 스케일링
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 데이터 분할
    X_train, X_test, y_train_pm10, y_test_pm10 = train_test_split(X_scaled, y_pm10, test_size=0.2, random_state=42)
    X_train, X_test, y_train_pm25, y_test_pm25 = train_test_split(X_scaled, y_pm25, test_size=0.2, random_state=42)
    X_train, X_test, y_train_ozone, y_test_ozone = train_test_split(X_scaled, y_ozone, test_size=0.2, random_state=42)

    # 하이퍼파라미터 튜닝
    rf_param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [10, None],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2]
    }

    # GridSearchCV 설정
    rf_grid_search = GridSearchCV(estimator=RandomForestRegressor(random_state=42), param_grid=rf_param_grid, 
                                  scoring='neg_mean_squared_error', cv=3, n_jobs=-1, verbose=2)

    # PM10 모델 튜닝
    rf_grid_search.fit(X_train, y_train_pm10)
    best_rf_pm10 = rf_grid_search.best_estimator_
    best_params_rf_pm10 = rf_grid_search.best_params_
    print("Best Params for PM10:", best_params_rf_pm10)

    # PM2.5 모델 튜닝
    rf_grid_search.fit(X_train, y_train_pm25)
    best_rf_pm25 = rf_grid_search.best_estimator_
    best_params_rf_pm25 = rf_grid_search.best_params_
    print("Best Params for PM2.5:", best_params_rf_pm25)

    # 오존 모델 튜닝
    rf_grid_search.fit(X_train, y_train_ozone)
    best_rf_ozone = rf_grid_search.best_estimator_
    best_params_rf_ozone = rf_grid_search.best_params_
    print("Best Params for Ozone:", best_params_rf_ozone)

if __name__ == "__main__":
    main()
