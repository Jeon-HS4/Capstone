from flask import Flask
from .module1 import init_app as init_module_one

def create_app():
    app = Flask(__name__, static_folder='module1/static')
    app.config.from_pyfile('config.py')

    init_module_one(app)
    return app
