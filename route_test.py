# By Timothy Van Heest
# 2013-10-03

import urllib2
import re
import csv
from datetime import datetime
import ConfigParser
import string
import time
from collections import defaultdict

"""
https://developers.google.com/maps/documentation/directions/#DirectionsRequests
- Using the API, onlu biz customers can get route time in current traffic, 
  so we need to scrape
"""

def check_config():
  """ Read a configuration file to decide what to run"""
  config = ConfigParser.SafeConfigParser()
  config.read('routes.cfg')
  # Get items as raw to avoid '%' interpolation
  routes = config.items('Routes', True)
  
  # Reformat routes into a dictionary
  formatted_routes = defaultdict(dict)
  route_types = ['morning', 'evening']
  for route in routes:
    found = False
    for route_type in route_types:
      route_type_identifier = '-%s' %(route_type)
      if route_type_identifier in route[0]:
        route_name = route[0].split(route_type_identifier)[0]
        formatted_routes[route_name][route_type] = route[1]
        found = True
        continue
    if not found:
      # This is not just a morning or evening route
      # Assume its for both coming and going
      route_name = route[0]
      for route_type in route_types:
        # Add explicit entries for morning and evening routes
        formatted_routes[route_name][route_type] = route[1]
      
  # Check day of week to see if calculation is needed
  daysofweek = config.get('Checktimes', 'daysofweek')
  if daysofweek == 'ad':
    pass
  elif daysofweek == 'wd':
    if not(datetime.today().weekday() < 5):
      return ({}, None)
  elif daysofweek == 'we':
    if not(datetime.today().weekday() >= 5):
      return ({}, None)
  else:
    raise Error("Invalid configuation: 'daysofweek' must be 'ad', 'wd', or 'we'")
  
  # Check time of day to find which route to run, if any
  route_type = None
  hour = int(datetime.now().strftime('%H'))
  if (hour > config.getint('Checktimes', 'morningstart') and
      hour <= config.getint('Checktimes', 'morningend')):
    route_type = 'morning'
  elif (hour > config.getint('Checktimes', 'eveningstart') and
      hour <= config.getint('Checktimes', 'eveningend')):
    route_type = 'evening'
  else:
    print ("Not running because %d is not within specified time ",
           "ranges for morning and evening commutes") %(hour)
    return ({}, None)

  return (formatted_routes, route_type)

def calculate_route_time(route):
  """Take a url representing a route.  Return time information. """
  route_name = route[0]
  url = route[1]
  q = urllib2.urlopen(url)
  response = q.read()
  f1 = string.find(response, 'id="panel_dir"')  # Find side panel
  # Find first route alternative within side panel
  f2 = string.find(response[f1:-1],
    '<div class="altroute-rcol altroute-aux">')
  # Get section of html around this div
  result = response[f1+f2:f1+f2+200]
  # Scrape out time component from this data
  time_data = (re.search('<span>(.*)</span>', result)
    .group(1).split('traffic: ')[1])
  
  # Calculate time in minutes
  mins = -1
  if 'hour' in time_data:
    r = re.search('(\d+) hour[\w ]* (\d+) min', time_data)
    mins = int(r.group(1))*60 + int(r.group(2))
  else:
    mins = int(re.search('(\d+) min', time_data).group(1))

  # Get together object for output
  day_of_week = datetime.today().weekday()  # 0 for Monday, 6 for Sunday
  date = datetime.today().strftime('%Y%m%d')  # E.g. 20131003
  time_of_day = datetime.now().strftime("%H:%M")  # E.g. 15:30
  return (route_name, date, day_of_week, time_of_day, mins)

if __name__ == "__main__":
  """Main script """
  (routes, route_type) = check_config()
  with open('route_times.csv', 'ab+') as csvfile:
    writer = csv.writer(csvfile)
    for route_name, route_urls in routes.items():
      if route_type in route_urls:
        # Skip this if not specified
        # Allows user to do just morning or evening routes
        writer.writerow(calculate_route_time(
          (route_name, route_urls[route_type])))
        # Wait a couple seconds so we don't freak Google out
        time.sleep(2)
  