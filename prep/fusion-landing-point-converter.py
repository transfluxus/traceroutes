import csv
from xml.etree import ElementTree as ET
import json

with open('fusion-landing-points-201610131609.csv', 'rb') as csvfile:

	feature_collection = {'type': 'FeatureCollection'}
	features = []

	reader = csv.DictReader(csvfile)
	for row in reader:
		# print ', '.join([row['id'],row['name'],row['coordinates']])
		feature = {'type':'Feature'}

		properties = {'name':row['name']}
		# , 'marker-color': 'DarkSeaGreen', 'marker-symbol' : 'harbor'}

		feature['properties'] = properties
		
		geometry = {'type':'Point'}
		s_coordinates = ET.fromstring(row['coordinates'])[0].text.split(',')
		coordinates = [float(s_coord) for s_coord in s_coordinates]
		geometry['coordinates'] = coordinates
		feature['geometry'] = geometry

		features.append(feature)

	feature_collection['features'] = features

	with open('landing_points.json', 'w') as jsf:
		jsf.write(json.dumps(feature_collection))

