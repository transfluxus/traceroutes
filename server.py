from flask import Flask, render_template, send_file, safe_join, request,jsonify
import json
from datetime import datetime
from flask.ext.socketio import SocketIO, emit
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['TEMPLATES_AUTO_RELOAD'] = True
socketio = SocketIO(app)

@app.route('/', methods=['GET'])
def index():
	return render_template('index.html')

@app.route('/today_routes',methods=['GET'])
def getRoutes():
    make_dir('routes')
    files = os.listdir("routes")
    now = datetime.now()
    return_routes = []
    # print files
    for file in files:
        if not file.startswith('r-'):
            continue
        # print file[2:-5]
        file_time = datetime.strptime(file[2:-5],'%y%m%d-%H%M%S')
        if (now - file_time).days < 1:
            # print 'adding',file
            with open('routes/'+file) as f:
                return_routes.append(json.loads(f.read()))
    print 'returning',len(return_routes),'routes'
    return json.dumps(return_routes)

def get_next_route_id():
	return len(os.listdir("routes")) - 1;

@app.route('/archive_routes',methods=['GET'])
def archive_routes():
    make_dir('archived_routes')
    files = os.listdir("routes")
    # print files
    for file in files:
        if not file.startswith('r-'):
            continue
        os.rename("routes/"+file, "archived_routes/"+file)
    return render_template('index.html')
# @app.route('/collect',methods=['GET'])
# def collect():
#     return render_template('collect.html')

@app.route('/newroute', methods=["POST"])
def input():
    try:
        values = request.values
        # print '//////'
        # print values
        # print '//////'
        url = values['url']
        total_km = values['total_km']
        datasize = values['datasize']
        co2 = values['co2']
        # print url, total_km, datasize, co2
        points = json.loads(values['points'])
        val_dict = values.to_dict()
        val_dict['points'] = points
        trackers = json.loads(values['trackers'])
        val_dict['trackers'] = trackers
        val_dict['route_id'] = get_next_route_id()
        val_json = json.dumps(val_dict)
        socketio.emit('newroute', val_json, broadcast=True)
        timeStamp = datetime.now().strftime('%y%m%d-%H%M%S')
        with open('routes/r-'+timeStamp+'.json','w') as f:
            f.write(val_json)
        ret = {'route_id': val_dict['route_id']}
        # print 'p:',points
    except Exception as err:
        print err
        ret = {'route_id': -1}
    # inputS = None
    # try:
    #     inputS = values['url']
    # except TypeError:
    #     return jsonify({'status': 'no-input', 'response': whatever()})
    # print inputS
    # return http_calls.input(inputS)
    return jsonify(**ret);

@app.route('/at',methods=['GET'])
def access_token():
    return '{"name": "accessToken","t" : "pk.eyJ1IjoicmFtaW4zNiIsImEiOiJjaXY1ODdlcjIwMTdiMm9uMGcyNjdjZGphIn0.7Dd6vr8zEdXt4d5zWCcDWA"}'

@app.route('/ixp',methods=['GET'])
def exchange_points():
    with open('data/exchange_nodes.json') as f:
        return f.read()

@app.route('/lp',methods=['GET'])
def landing_points():
    print 'lps'
    with open('data/landing_points.json') as f:
        return f.read()

@socketio.on('connect', namespace='')
def connect():
    print 'client connected'
    emit('connect', {'data': 'Connected'})

@socketio.on('disconnect', namespace='')
def disconnect():
    print 'Client disconnected'

def make_dir(dir):
    if not os.path.exists(dir):
        os.makedirs(dir)


# RUN APP
if __name__ == "__main__":
    # app.run(host='0.0.0.0',debug=True)
    socketio.run(app, host='0.0.0.0',debug=True)
    # socketio.run(app,debug=False, host='0.0.0.0', port=8080)
