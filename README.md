# Get player-ratings for chessmail users

For some tournaments on chessmail.de, the players ratings are needed. This cli-node-scripts reads the rating from the graph on the given users page.

Use it like this:

    % node player-download.js <playername> <days>

With the second parameter <days> you can choose, for how many days the avarage player rating should be calculated (default: 90 days)


## ToDos

- Basic caching, as the graph is only updated once a day, there is no need to download the players profile-page on the same day again.
- Multi-player calculation: Add a list (space sperated) of playernames, with the last parameter still the amount of days to calculate the avarege (there should/will be a time delay between the requests of 5 seconds)
- Adding use cases like prepare a list of users in a file with a placeholder for scores, script will replace the placesholders with the averages.
- More use cases need
- If there is an API available, switch to that

> Let's play chess :-)
