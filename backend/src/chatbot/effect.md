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

## case 2: "How to make an order"
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

# 



