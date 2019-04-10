# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

# Restaurant Reviews 
Part of Udacity's Mobile Web Specialist Nanodegree program. Completed in three stages, I refactored a starter website to include offline capabilities, paying special attention to responsiveness and accessibility. To complete the project, I had to learn about ARIA, ES6, IndexedDB, and service workers, as well as how to work closely with the browser's dev tools. 

## Stage 1
**Responsive Design**
+ All content is responsive and displays on a range of display sizes.
+ Content makes use of available screen real estate and displays correctly at all screen sizes.
+ An image's associated title and text renders next to the image in all viewport sizes.
+ Images in the site are sized appropriate to the viewport and do not crowd or overlap other elements in the browser, regardless of viewport size.
+ On the main page, restaurants and images are displayed in all viewports. The detail page includes a map, hours and reviews in all viewports.

**Accessibility**
+ All content-related images include appropriate alternate text that clearly describes the content of the image.
+ Focus is appropriately managed allowing users to noticeably tab through each of the important elements of the page. Modal or interstitial windows appropriately lock focus.
+ Elements on the page use the appropriate semantic elements. For those elements in which a semantic element is not available, appropriate ARIA roles are defined.

**Offline Availability**
+ When available in the browser, the site uses a service worker to cache responses to requests for site assets. 
+ Visited pages are rendered when there is no network access.

**See Stage 1 commit:** [ffab9cb](https://github.com/asteig/mws-restaurant-reviews/commit/ffab9cb198cd4c2bbbecaca1f152c37019399722)

## Stage 2

**Application Data and Offline Use**
+ The client application should pull restaurant data from the development server, parse the JSON response, and use the information to render the appropriate sections of the application UI.
+ The client application works offline. JSON responses are cached using the IndexedDB API. 
+ Any data previously accessed while connected is reachable while offline.

**Responsive Design and Accessibility**
+ The application maintains a responsive design on mobile, tablet and desktop viewports.
+ The application retains accessibility features from the Stage 1 project. 
+ Images have alternate text, the application uses appropriate focus management for navigation, and semantic elements and ARIA attributes are used correctly.

**Performance**
Lighthouse targets for each category exceed:
  + Progressive Web App: >90
  + Performance: >70
  + Accessibility: >90

**See Stage 2 commit:** [fc700cf](https://github.com/asteig/mws-restaurant-reviews/commit/fc700cf780e83433c65a27c669fff2796a0116ad)

## Stage 3
**User Interface**
+ Users are able to mark a restaurant as a favorite, this toggle is visible in the application. 
+ A form is added to allow users to add their own reviews for a restaurant. 
+ Form submission works properly and adds a new review to the database.

**Offline Use**
+ The client application works offline. 
+ JSON responses are cached using the IndexedDB API. 
+ Any data previously accessed while connected is reachable while offline. 
+ User is able to add a review to a restaurant while offline and the review is sent to the server when connectivity is re-established.

**See commit:** [c440139](https://github.com/asteig/mws-restaurant-reviews/commit/c440139eddc1ce1b4776597748541a6d9e88b7f6)


 
