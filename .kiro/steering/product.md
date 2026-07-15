# Railway Control System

A railway management platform for booking and operations management in the railway station named "Vaprise"
## 🚀 Feature Roadmap & Technical Requirements

### 1. Customer signup, login (Priority: MEDIUM) 
* **User Story:** As a user, the first function i need is a signup and login page to use the service
* **Functional Requirements:**
  - Signup information required the user to provide id, fullname, email, phone, password
  - Login information required the email, id and password
* **Acceptance Criteria (How to know it's done):**
  - the input of the user must be validated, if this is not follow the designed format inform them
  - if user provided email or id when login is appeared on the database, inform them this account is already exist

### 2. Staff signup, login ( Priority: MEDIUM)
* **User story:** I have passing the interview and now i want to create and login to my account
* **Functional Requirement:** 
    -similar to the user login, singup
* **Acceptance Criteria:**
- ensure there are no mistake like mixed up between user and staff

### 3. Make an Order (Priority: HIGHEST)
* **Customer Story:** Now as a customer my purpose is buy tickets not only me but also my family
* **Functiona Requirement:**
    - make the page only for make order, allow user add, delete, change, copy the current ticket booking, when user is complete and click on make order, show a loading spinner/progress until the backend is reponsed
    - when user want to choose a trip and a seat on this trip make a scene for user find trip and click on the seat icon to choose, different seat class, different seat status is distinguish by color
    - when user init and still on the booking process store the data on the redux and persist this until they click on button make order"
* **Acceptance Criteria:**
    - ensure all the exception, error, is catch and inform to the user
    - make the interface easy for user easy to use, understandable

### 4. See the Incoming Trip(Priority: HIGH)
* **Customer Story:** Before making an order i want to firstly check the incoming trip
* **Functional Requirement:**
    - fetching all the trip on the database also their seat information(number of available seat, arrival time, their schedule to the station in a graph)
    - allow user fastly find the suitable trip based on the station name which this trip will come(remember that our project only manage one stations which is named "Vaprise")
    - provide the button which navigate user to the make an order page when they find their finding trip
* **Acceptance Criteria:**
    - the performance of this page must be optimized, becaused of the visual effect
    - ensure that user will see all of these features in all screen width

---
### 5.Customer Profie(Priority: Medium)
* **Customer Story:**As an customer i want to see my       individual information as well as some statistics about my recent activities
* **Funcitional Requirement**
    - a table about customer information which user can switch to the changeable mode and start to update  a new information except of the id and the password.
    - some block about the total order, the latest order, average price for each payment, the user point and rank
    - a chart to show the number of order and ticket made in each month on a specific years 
* **Acceptance Criteria:**
    - complete all these features corectly
### 6. Staff function(Priority: Medium)
* **Customer Story:**  as an staff of this station when i login as an staff i can see the "Peding" state order and accept this 
* **Functional Requirement**

### 7.Staff Profile(Priority: Medium)
* **Customer Story:** a staff like me also demand for a profile page to update and see my information
* **Functional Requirement**
    - a table about staff information which user can switch to the changeable mode and start to update  a new information except of the id and the password.
    - a chart to show the number of order which i accept or denied in each month on a specific years 
    - a time line to show my shift schedules on one day
* **Acceptance Criteria:**
    - The user also have the profile page so you must distinguish between the customer profile page and staff profile page
    - reusable the code

###


### 3. User Profile Customization (Priority: LOW) [Status: Backlog]
* **User Story:** As a chat participant, I want to change my avatar color so I can stand out.
* **Functional Requirements:**
  - Provide 5 pre-set color schemes (e.g., Forest Green, Deep Blue, Charcoal).
  - Save the choice locally in `localStorage`.


## Domain Entities

- **Customer** — registered passengers with a loyalty rank
- **Staff** — employees with roles and shift schedules, can not make an order
- **Trip** — a scheduled journey on a track with an arrival date
- **Seat / SeatClass** — seats belong to a trip and a class (e.g., economy, business) with a price
- **Order** — created by a customer, optionally handled by staff; status: `Pending | Confirmed | Denied`
- **Ticket** — one ticket per seat per order, carries passenger ID (CCCD) and name; status: `Open | Resolved`
- **Payment / Method** — payment record linked to an order with a chosen payment method
- **Station** — graph node with `nextStations` self-relation for route modeling
- **Feedback** — customer comments attached to their account
