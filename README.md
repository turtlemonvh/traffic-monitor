# Traffic Monitor

A simple python application for getting traffic data from Google Maps to do some simple commute time by time of day anaysis.

I couldn't find any nice graphs on commute time by time of day (* see notes below) - the knowledge about the best time of day to come and go seems to be passed from person to person based on experience.  Why not get some data?

## Dependencies

Just Python 2.7 is required for the python script.

There is also an executable for 64 bit Windows.  To use this, download the zip folder from [the "Releases" section](https://github.com/turtlemonvh/traffic-monitor/releases).  Unzip the folder and edit the configuration file to suit your needs.  Run the `route_test.exe` executable within the downloaded folder.

## Configuration

There should be a `routes.cfg` file in the directory where the utility is run.  It should look something like this:

    [Routes]
    # List routes as urls
    # names used here will be included on lines of csv output file
    route_a: https://maps.google.com/maps?saddr=Atlanta,+GA&daddr=Nashville,+TN&hl=en

    [Checktimes]
    # daysofweek = wd for weekdays, we for weekends, ad for all days
    daysofweek: wd

    # Times are integer militart-time hours in your time zone
    morningstart: 5
    morningend: 10
    eveningstart: 15
    eveningend: 20

In the list of routes, adding `-morning` or `-evening` at the end of a route name will cause it to be calculated only for evening or morning periods.  This option should be used most of the time to specific the direction for coming and going.  An example "Routes" section for a commuter going between Atlanta and Nashville would look look like:

    [Routes]
    route_a-morning: https://maps.google.com/maps?saddr=Atlanta,+GA&daddr=Nashville,+TN&hl=en
    route_a-evening: https://maps.google.com/maps?saddr=Nashville,+TN&daddr=Atlanta,+GA&hl=en

If neither `-morning` nor `-evening` is included in a route name, the route is run for both times of day.  This may be useful for general analysis of traffic patterns.
    
## Use

Create the configuration file and set this up to run every few minutes with cron, [Windows Task Scheduler](http://support.microsoft.com/kb/308569), or a similar utility.  I suggest limiting yourself to something less frequent than every 10 minutes because the extra data isn't that useful and it's more likely to get you noticed by Google.  We're screen scraping here, so lets be considerate.

For Windows Task Scheduler, make sure you run the command with a user account that has "Log on as a batch job" permissions (any admin account will do) or you will see the 2147943785 error code in your scheduled job.

An output file named `route_times.csv` will be placed in the directory where this is run.  It will look something like the following:

    route_a,20131003,3,19:24,37
    route_a,20131003,3,19:34,37
    route_a,20131003,3,19:44,36

The contents of the columns in each line are as follows:

1. The name of the route defined in your config file.
2. The date the route was calculated.
3. The day of the week, where Monday is 0 and Sunday is 6.
4. The time of day that the route was calculated.
5. The estimated time to complete the route in minutes.

After a few weeks of running this script you should be able to load your data into Excel or a similar application and do some analysis to determine the best time of day to come and go from the office.  If you find anything interesting from doing this, [send me an email](mailto:timothy.vanheest@gtri.gatech.edu).  I'd like to hear about it.

## Notes

* I was just made aware of the fact that [you can access Google's past traffic density data through Google Maps directly](http://searchengineland.com/google-maps-now-offers-traffic-predictions-13798), and this feature has actually been around for a while.  Still, as far as I know you can't get actual commute time estimates out of this, just colored lines indicating traffic density.  If you want to plan your route, use the Google Maps feature.  If you want some time estimates to look at, this script may still be useful to you.

* To visualize the output of this tool with a series of plots that allow you to filter on multiple data dimensions simulteneously, see the [github pages website for this project](http://turtlemonvh.github.io/traffic-monitor/).

* You can find historical data for commute times on Atlanta's [southbound connector](https://maps.google.com/maps?saddr=I-75+S%2FI-85+S&daddr=I-75+S%2FI-85+S&hl=en&ll=33.777899,-84.381738&spn=0.033424,0.066047&sll=33.691581,-84.402208&sspn=0.005915,0.008256&geocode=FW18AwIdyUr4-g%3BFRAeAgIdMBr4-g&t=h&mra=me&mrsp=1,0&sz=18&z=15) and [northbound connector](https://maps.google.com/maps?saddr=I-75+N%2FI-85+N&daddr=I-85+N&hl=en&ll=33.725625,-84.380836&spn=0.066889,0.132093&sll=33.694398,-84.403576&sspn=0.005914,0.008256&geocode=FUEmAgIdhxb4-g%3BFc6VAwIdYkz4-g&t=h&mra=me&mrsp=0&sz=18&z=14) in the `sample_data` directory of this repository.
