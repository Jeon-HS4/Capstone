import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error
from catboost import CatBoostRegressor
from xgboost import XGBRegressor
from scipy.stats import randint
from datetime import timedelta

# Load datasets
fine_dust_path = 'app/module1/static/data/미세먼지.csv'
temperature_path = 'app/module1/static/data/기온.csv'

fine_dust_df = pd.read_csv(fine_dust_path)
temperature_df = pd.read_csv(temperature_path)

# Ensure numerical columns are properly typed
fine_dust_df['아황산가스'] = pd.to_numeric(fine_dust_df['아황산가스'], errors='coerce')
fine_dust_df['이산화질소'] = pd.to_numeric(fine_dust_df['이산화질소'], errors='coerce')
fine_dust_df['일산화탄소'] = pd.to_numeric(fine_dust_df['일산화탄소'], errors='coerce')

# Preprocess data
def add_features(df):
    df['기온_차이'] = df['평균기온'].diff().fillna(0)
    df['강수량_차이'] = df['일강수량'].diff().fillna(0)
    df['기온_이동평균'] = df['평균기온'].rolling(window=3).mean().fillna(df['평균기온'])
    df['강수량_이동평균'] = df['일강수량'].rolling(window=3).mean().fillna(df['일강수량'])
    df['기온_최대값'] = df['평균기온'].rolling(window=3).max().fillna(df['평균기온'])
    df['기온_최소값'] = df['평균기온'].rolling(window=3).min().fillna(df['평균기온'])
    df['기온_중앙값'] = df['평균기온'].rolling(window=3).median().fillna(df['평균기온'])
    df['월'] = df['일시'].dt.month
    df['일'] = df['일시'].dt.day
    df['요일'] = df['일시'].dt.weekday
    return df

fine_dust_df = fine_dust_df.iloc[3:]
fine_dust_df.columns = ['날짜', 'PM10', 'PM2.5', '오존', '이산화질소', '일산화탄소', '아황산가스', '최종확정여부']
fine_dust_df = fine_dust_df.drop(columns=['최종확정여부'])
fine_dust_df['날짜'] = pd.to_datetime(fine_dust_df['날짜'])

temperature_df.columns = ['지점', '지점명', '일시', '평균기온', '일강수량', '평균 풍속', '평균 상대습도', '평균 현지기압', '평균 전운량']
temperature_df['일시'] = pd.to_datetime(temperature_df['일시'])
temperature_df = temperature_df[['일시', '평균기온', '일강수량', '평균 상대습도', '평균 전운량', '평균 풍속']]
temperature_df = add_features(temperature_df)

merged_df = pd.merge(fine_dust_df, temperature_df, left_on='날짜', right_on='일시', how='inner')
merged_df = merged_df.drop(columns=['일시'])

numeric_columns = merged_df.select_dtypes(include=['float64', 'int64']).columns
merged_df[numeric_columns] = merged_df[numeric_columns].fillna(merged_df[numeric_columns].mean())

target_columns = ['PM10', 'PM2.5', '오존']
feature_columns = merged_df.columns.difference(target_columns + ['날짜'])

X = merged_df[feature_columns]
y_pm10 = merged_df['PM10']

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train_pm10, y_test_pm10 = train_test_split(X_scaled, y_pm10, test_size=0.2, random_state=42)

models = {
    'CatBoost': CatBoostRegressor(random_state=42, silent=True),
    'XGBoost': XGBRegressor(random_state=42)
}

param_dists = {
    'CatBoost': {
        'iterations': randint(50, 200),
        'depth': randint(3, 10),
        'learning_rate': [0.01, 0.1, 0.2, 0.3],
        'l2_leaf_reg': randint(1, 10),
        'bagging_temperature': [0.7, 0.8, 0.9, 1.0]
    },
    'XGBoost': {
        'n_estimators': randint(50, 200),
        'max_depth': randint(3, 10),
        'learning_rate': [0.01, 0.1, 0.2, 0.3],
        'subsample': [0.7, 0.8, 0.9, 1.0],
        'colsample_bytree': [0.7, 0.8, 0.9, 1.0],
        'reg_alpha': [0, 0.1, 0.5, 1],
        'reg_lambda': [0.1, 0.5, 1]
    }
}

best_models = {}
for model_name, model in models.items():
    random_search = RandomizedSearchCV(model, param_distributions=param_dists[model_name], n_iter=100, scoring='neg_mean_squared_error', cv=5, random_state=42, n_jobs=-1)
    random_search.fit(X_train, y_train_pm10)
    best_models[model_name] = random_search.best_estimator_

# 예측
y_pred_catboost = best_models['CatBoost'].predict(X_test)
y_pred_xgboost = best_models['XGBoost'].predict(X_test)
y_pred_ensemble = (y_pred_catboost + y_pred_xgboost) / 2

# 성능 평가
r2_catboost = r2_score(y_test_pm10, y_pred_catboost)
mae_catboost = mean_absolute_error(y_test_pm10, y_pred_catboost)

r2_xgboost = r2_score(y_test_pm10, y_pred_xgboost)
mae_xgboost = mean_absolute_error(y_test_pm10, y_pred_xgboost)

r2_ensemble = r2_score(y_test_pm10, y_pred_ensemble)
mae_ensemble = mean_absolute_error(y_test_pm10, y_pred_ensemble)

print(f"CatBoost R²: {r2_catboost}, MAE: {mae_catboost}")
print(f"XGBoost R²: {r2_xgboost}, MAE: {mae_xgboost}")
print(f"Ensemble R²: {r2_ensemble}, MAE: {mae_ensemble}")
