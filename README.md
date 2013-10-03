# Traffic Monitor

A simple python application for getting traffic data from Google Maps to do some simple commute time by time of day anaysis.

I couldn't find any nice graphs on commute time by time of day - the knowledge about the best time of day to come and go seems to be passed from person to person based on experience.  Why not get some data?

## Dependencies

Just Python 2.7.

## Configuration

There should be a `routes.cfg` file in the directory where the utility is run.  It should look something like this:

    [Routes]
    # List routes as urls
    # Extra urls can be added on extra indented lines
    checkurl: https://maps.google.com/maps?saddr=Atlanta,+GA&daddr=Nashville,+TN&hl=en

    [Checktimes]
    # daysofweek = wd for week days, ad for all days
    daysofweek: wd

    # Times are integer militart-time hours in your time zone
    morningstart: 5
    morningend: 10
    eveningstart: 15
    eveningend: 20

## Use

Set this up to run every few minutes with cron, [Windows Task Scheduler](http://support.microsoft.com/kb/308569), or a similar utility.  I suggest limiting yourself to less than every 10 minutes because the extra data isn't that useful and its more likely to get you noticed by Google.  We're screen scraping here, so lets be considerate.

An output file named `route_times.csv` will be placed in the directory where this is run.  You should be able to load this up into Excel or a similar application and do some analysis to determine the best time of day to come and go from the office.

For Windows Task Scheduler, make sure you run the command with a user account that has "Log on as a batch job" permissions or you will see the 2147943785 result code.

If you find anything interesting from doing this, [send me an email](mailto:timothy.vanheest@gtri.gatech.edu).  I'd like to hear about it.
