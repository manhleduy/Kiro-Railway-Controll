# commit 1: 
## environment:
+ Ai agent read the docs
+ Save on the vectorstore 
+ Answer the raw query from
## testing
### case 1: "Hello"
- frontend run time: ~14000
- evaluation:
 --- RAG SYSTEM EVALUATION RESULTS ---
Faithfulness (No Hallucination): ✅ PASS
Feedback: YES. 

The context mentions "recent orders" and "monthly expenses", which supports the information that there is some data about recent orders on the profile page.

Relevancy (Answered Question):  ❌ FAIL
Feedback: NO, The response for the query "hello" is not in line with the context information provided.

### case 2: "How to make an order"
- frontend run time: ~15000
- evaluation
+ Faithfulness (No Hallucination): ✅ PASS
+ Feedback: Information: To make an order, follow these steps:

    1. Go to the "Orders" page.
    2. Choose the name of the user.
    3. Select the pass cccd of the user.
    4. Go to the trip page and choose the desired trip.
    5. Choose a number of seats first.
    6. After completing the above steps, click on the "Confirm Order" button.

### case 3: "/station i want to go to Hai Phong
- Query:  
    `your are an AI agent which can help our customer,
    you can help based on the user query which is 
    ${query} your have to determine the: 
    location: where customer going to come
            
    below is the station list:
        ${station.map((element)=>`
            {
              stationId: ${element.stationId},
              name: ${element.name},
              location: ${element.location}
            }
          `)}

            only from this station list, anser the question
            "what station i am going to provide me the name and the stationId" 
            know that the location value of each station is the name of the city or province or village or the state  which that station is located
            your answer have the format like this:
            station name,
            station stationId`
- answer:
Based on the provided context and user query, I can determine that you are looking for a station in Hai Phong. After reviewing the station list, I found that there is only one station that matches the location "Hai phong".

Here's my answer:

* Station Name: Emmittview
* Station ID: VN1000

This station provides the name and station ID that you requested.
            



