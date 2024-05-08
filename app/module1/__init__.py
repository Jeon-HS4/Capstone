from flask import Flask
from .views import bp as module_one_bp

def init_app(app):
    app.register_blueprint(module_one_bp)
