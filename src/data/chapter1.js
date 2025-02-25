export const chapter1 = {
  id: 1,
  title: "A Little Give and Take: Mental Addition and Subtraction",
  description: "Learn the left-to-right method of doing mental addition and subtraction for most numbers that you encounter on a daily basis.",
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      content: `For as long as I can remember, I have always found it easier to add and subtract numbers from left to right instead of from right to left. By adding and subtracting numbers this way, I found that I could call out the answers to math problems in class well before my classmates put down their pencils. And I didn't even need a pencil!

In this chapter you will learn the left-to-right method of doing mental addition and subtraction for most numbers that you encounter on a daily basis. These mental skills are not only important for doing the tricks in this book but are also indispensable in school, at work, or any time you use numbers. Soon you will be able to retire your calculator and use the full capacity of your mind as you add and subtract two-digit, three-digit, and even four-digit numbers with lightning speed.`
    },
    {
      id: "left-to-right-addition",
      title: "Left-to-Right Addition",
      content: `Most of us are taught to do math on paper from right to left. And that's fine for doing math on paper. But if you want to do mental math, it's much easier to work from left to right.

Let's look at a simple example: 67 + 28. First, add the tens digits: 60 + 20 = 80. Then add the ones digits: 7 + 8 = 15. Finally, combine the results: 80 + 15 = 95.

67 + 28 = 87 + 8 = 95
(first add 20)   (then add 8)

Now try one on your own, mentally calculating from left to right, and then check below to see how we did it:

84
+ 57 (50 + 7)

How was that? You added 84 + 50 = 134 and added 134 + 7 = 141.

84 + 57 = 134 + 7 = 141
(first add 50)   (then add 7)

If carrying numbers trips you up a bit, don't worry about it. This is probably the first time you have ever made a systematic attempt at mental calculation, and if you're like most people, it will take you time to get used to it. With practice, however, you will begin to see and hear these numbers in your mind, and carrying numbers when you add will come automatically. Try another problem for practice, again computing it in your mind first, then checking how we did it:

68
+ 45 (40 + 5)

You should have added 68 + 40 = 108, and then 108 + 5 = 113, the final answer. Was that easier? If you would like to try your hand at more two-digit addition problems, check out the set of exercises below. (The answers and computations are at the end of the book.)`
    },
    {
      id: "left-to-right-subtraction",
      title: "Left-to-Right Subtraction",
      content: `Subtraction from left to right works in a similar way. Let's look at a simple example: 87 - 34. First, subtract the tens digits: 80 - 30 = 50. Then subtract the ones digits: 7 - 4 = 3. Finally, combine the results: 50 + 3 = 53.

But what if the ones digit in the second number is larger than the ones digit in the first number? For example, let's try 82 - 37. First, subtract the tens digits: 80 - 30 = 50. Then try to subtract the ones digits: 2 - 7. Since 2 is less than 7, we need to borrow from the tens place. So instead of thinking of this as 2 - 7, we think of it as 2 - 7 = -5. Then we combine the results: 50 + (-5) = 45.

Let's try a three-digit example: 742 - 368. First, subtract the hundreds digits: 700 - 300 = 400. Then subtract the tens digits: 40 - 60 = -20. Then subtract the ones digits: 2 - 8 = -6. Finally, combine the results: 400 + (-20) + (-6) = 374.`
    }
  ],
  exercises: {
    types: [
      {
        id: "addition",
        title: "Left-to-Right Addition",
        description: "Practice adding numbers from left to right mentally.",
        difficulty: ["easy", "medium", "hard"]
      },
      {
        id: "subtraction",
        title: "Left-to-Right Subtraction",
        description: "Practice subtracting numbers from left to right mentally.",
        difficulty: ["easy", "medium", "hard"]
      }
    ]
  }
}; 