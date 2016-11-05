from flask import Flask, render_template, send_file, safe_join, request,jsonify
import json
from datetime import datetime
from flask.ext.socketio import SocketIO, emit
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
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
        description = values['description']
        total_km = values['total_km']
        datasize = values['datasize']
        co2 = values['co2']
        # print url, description, total_km, datasize, co2
        points = json.loads(values['points'])
        val_dict = values.to_dict()
        val_dict['points'] = points       

        trackers = json.loads(values['trackers'])
        val_dict['trackers'] = trackers
        val_json = json.dumps(val_dict)   
        # socketio.emit('my response', {'data': val_json}, namesspace = '', broadcast=True)
        socketio.emit('newroute', val_json, broadcast=True)
        # print len(points)
        # print '<<<<<<'
        timeStamp = datetime.now().strftime('%y%m%d-%H%M%S')
        with open('routes/r-'+timeStamp+'.json','w') as f:
            f.write(val_json)
        # print 'p:',points
    except Exception as err:
        print err
        return '{}'
    # inputS = None
    # try:
    #     inputS = values['url']
    # except TypeError:
    #     return jsonify({'status': 'no-input', 'response': whatever()})
    # print inputS
    # return http_calls.input(inputS)
    return '{}';


@socketio.on('connect', namespace='')
def test_connect():
    print 'client connected'
    # emit('my response', {'data': 'Connected'})

@socketio.on('disconnect', namespace='')
def test_disconnect():
    print 'Client disconnected'

def make_dir(dir):
    if not os.path.exists(dir):
        os.makedirs(dir)


# RUN APP
if __name__ == "__main__":
    app.run(host='0.0.0.0')
    # socketio.run(app, host='0.0.0.0')
    # socketio.run(app,debug=False, host='0.0.0.0', port=8080)