from flask import Flask, render_template, send_file, safe_join, request,jsonify
import json
from datetime import datetime
from flask.ext.socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

def whatever():
	return 'cool'

@app.route('/', methods=['GET'])
def index():
	return render_template('index.html')

@app.route('/collect',methods=['GET'])
def collect():
    return render_template('collect.html')

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
        val_json = json.dumps(val_dict)        
        # socketio.emit('my response', {'data': val_json}, namesspace = '', broadcast=True)
        socketio.emit('newroute', val_json, broadcast=True)
        # print len(points)
        # print '<<<<<<'
        timeStamp = datetime.now().strftime('%y%m%d-%H%M%S')
        with open('r-'+timeStamp+'.json','w') as f:
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

# RUN APP
if __name__ == "__main__":
    socketio.run(app)
    # socketio.run(app,debug=False, host='0.0.0.0', port=8080)