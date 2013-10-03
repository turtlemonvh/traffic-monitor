# By Timothy Van Heest
# 2013-10-03

import urllib2
import re
import csv
from datetime import datetime
import ConfigParser
import string

"""
https://developers.google.com/maps/documentation/directions/#DirectionsRequests
- Using the API, onlu biz customers can get route time in current traffic, so we need to scrape
"""

def check_config():
  """ Read a configuration file to decide what to run"""
  config = ConfigParser.SafeConfigParser()
  config.read('routes.cfg')
  search_urls = config.get('Routes', 'checkurl').split('\n')
  
  # Check day of week
  daysofweek = config.get('Checktimes', 'daysofweek')
  if daysofweek == 'ad':
    pass
  elif daysofweek == 'wd':
    if not(datetime.today().weekday() < 5):
      return []
  else:
    raise Error("Invalid configuation: 'daysofweek' must be 'ad' or 'wd'")

  # Check day of week
  daysofweek = config.get('Checktimes', 'daysofweek')
  if daysofweek == 'ad':
    pass
  elif daysofweek == 'wd':
    if not(datetime.today().weekday() < 5):
      print "Not running because %s is not a valid day of week" %(datetime.today().weekday())
      return []
  else:
    raise Error("Invalid configuation: 'daysofweek' must be 'ad' or 'wd'")
  
  # Check time of day
  hour = int(datetime.now().strftime('%H'))
  if (hour < config.getint('Checktimes', 'morningstart') or
     hour >= config.getint('Checktimes', 'eveningend') or
     (hour >= config.getint('Checktimes', 'morningend') and
      hour < config.getint('Checktimes', 'eveningstart'))):
      print "Not running because %d is not a valid time of day" %(hour)
      return []

  return search_urls

def calculate_route_time(url):
  """Take a url representing a route.  Return time information. """
  q = urllib2.urlopen(url)
  response = q.read()
  f1 = string.find(response, 'id="panel_dir"') # Find side panel
  f2 = string.find(response[f1:-1], '<div class="altroute-rcol altroute-aux">') # Find first route alternative within side panel
  result = response[f1+f2:f1+f2+200] # get section of html around this div
  time_data = re.search('<span>(.*)</span>', result).group(1).split('traffic: ')[1] # scrape out time component from this data
  
  # Calculate time in minutes
  mins = -1
  if 'hour' in time_data:
    r = re.search('(\d+) hour[\w ]* (\d+) min')
    mins = int(r.group(1))*60 + int(r.group(2))
  else:
    mins = int(re.search('(\d+) min', time_data).group(1))

  # Get together object for output
  day_of_week = datetime.today().weekday() # 0 for Monday, 6 for Sunday
  date = datetime.today().strftime('%Y%m%d') # E.g. 20131003
  time_of_day = datetime.now().strftime("%H:%M") # E.g. 15:30
  return (date, day_of_week, time_of_day, mins)

if __name__ == "__main__":
  """Main script """
  search_urls = check_config()
  with open('route_times.csv', 'ab+') as csvfile:
    writer = csv.writer(csvfile)
    for url in search_urls:
      writer.writerow(calculate_route_time(url))
  