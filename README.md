# Traffic Monitor

A simple python application for getting traffic data from Google Maps to do some simple commute time by time of day anaysis.

I couldn't find any nice graphs on commute time by time of day - the knowledge about the best time of day to come and go seems to be passed from person to person based on experience.  Why not get some data?

## Dependencies

Just Python 2.7.

## Configuration

There should be a `routes.cfg` file in the directory where the utility is run.  It should look something like this:

    [Routes]
    # List routes as urls
    # names used here will be included on lines of csv output file
    route_a: https://maps.google.com/maps?saddr=Atlanta,+GA&daddr=Nashville,+TN&hl=en

    [Checktimes]
    # daysofweek = wd for week days, ad for all days
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

Create the configuration file and set this up to run every few minutes with cron, [Windows Task Scheduler](http://support.microsoft.com/kb/308569), or a similar utility.  I suggest limiting yourself to less than every 10 minutes because the extra data isn't that useful and its more likely to get you noticed by Google.  We're screen scraping here, so lets be considerate.
For Windows Task Scheduler, make sure you run the command with a user account that has "Log on as a batch job" permissions or you will see the 2147943785 result code.

An output file named `route_times.csv` will be placed in the directory where this is run.  It will look something like the following:

    route_a,20131003,3,19:24,37
    route_a,20131003,3,19:34,37
    route_a,20131003,3,19:44,36

The 1st column is the name of the route defined in your config file.  The 2nd is the date the route was calculated.  The 3rd is the day of the week where Monday is 0 and Sunday is 6.  The 4th is the time of day that the route was calculated, and the 5th and final column is the estimated time in minutes.

After a few weeks of running you should be able to load this up into Excel or a similar application and do some analysis to determine the best time of day to come and go from the office.  If you find anything interesting from doing this, [send me an email](mailto:timothy.vanheest@gtri.gatech.edu).  I'd like to hear about it.

