A simple python application for getting traffic data from Google Maps to do commute time by time of day anaysis.

# Configuration

Should look something like this

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

# Use

Set this up to run every few minutes with cron or a similar utility.  I suggest limiting yourself to less than every 10 minutes because the extra data isn't that useful and its more likely to get you noticed by Google.  We're screen scraping here, so lets be considerate.

