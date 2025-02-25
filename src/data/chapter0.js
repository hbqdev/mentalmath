export const chapter0 = {
  id: 0,
  title: "Quick Tricks: Easy (and Impressive) Calculations",
  description: "Learn some easy yet impressive calculations you can do immediately, before diving into more serious techniques later in the book.",
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      content: `In the pages that follow, you will learn to do math in your head faster than you ever thought possible. After practicing the methods in this book for just a little while, your ability to work with numbers will increase dramatically. With even more practice, you will be able to perform many calculations faster than someone using a calculator. But in this chapter, my goal is to teach you some easy yet impressive calculations you can learn to do immediately. We'll save some of the more serious stuff for later.`
    },
    {
      id: "instant-multiplication",
      title: "Instant Multiplication",
      content: `Let's begin with one of my favorite feats of mental math—how to multiply, in your head, any two-digit number by eleven. It's very easy once you know the secret. Consider the problem:

32 × 11

To solve this problem, simply add the digits, 3 + 2 = 5, put the 5 between the 3 and the 2, and there is your answer:

<div style="text-align: center; margin: 10px 0; font-family: Georgia, serif; font-weight: bold; font-size: 1.2em;">
  352
</div>

What could be easier? Now you try:

53 × 11

Since 5 + 3 = 8, your answer is simply

<div style="text-align: center; margin: 10px 0; font-family: Georgia, serif; font-weight: bold; font-size: 1.2em;">
  583
</div>

One more. Without looking at the answer or writing anything down, what is

81 × 11?

Did you get 891? Congratulations!
Now before you get too excited, I have shown you only half of what you need to know. Suppose the problem is

85 × 11

Although 8 + 5 = 13, the answer is NOT 8135!
As before, the 3 goes in between the numbers, but the 1 needs to be added to the 8 to get the correct answer:

<div style="text-align: center; margin: 10px 0; font-family: Georgia, serif; font-weight: bold; font-size: 1.2em;">
  935
</div>

Think of the problem this way:

<div style="text-align: center; margin: 20px 0; font-family: Georgia, serif;">
  <div style="font-size: 0.8em; margin-bottom: -5px;">1</div>
  <div style="text-decoration: underline;">835</div>
  <div style="font-weight: bold;">935</div>
</div>

Here is another example. Try 57 × 11.
Since 5 + 7 = 12, the answer is

<div style="text-align: center; margin: 20px 0; font-family: Georgia, serif;">
  <div style="font-size: 0.8em; margin-bottom: -5px;">1</div>
  <div style="text-decoration: underline;">527</div>
  <div style="font-weight: bold;">627</div>
</div>

Okay, now it's your turn. As fast as you can, what is

77 × 11?

If you got the answer 847, then give yourself a pat on the back. You are on your way to becoming a mathemagician.
Now, I know from experience that if you tell a friend or teacher that you can multiply, in your head, any two-digit number by eleven, it won't be long before they ask you to do 99 × 11. Let's do that one now, so we are ready for it.
Since 9 + 9 = 18, the answer is:

<div style="text-align: center; margin: 20px 0; font-family: Georgia, serif;">
  <div style="font-size: 0.8em; margin-bottom: -5px;">1</div>
  <div style="text-decoration: underline;">989</div>
  <div style="font-weight: bold;">1089</div>
</div>

Okay, take a moment to practice your new skill a few times, then start showing off. You will be amazed at the reaction you get. (Whether or not you decide to reveal the secret is up to you!)`
    },
    {
      id: "squaring-and-more",
      title: "Squaring and More",
      content: `Here is another quick trick.
As you probably know, the square of a number is a number multiplied by itself. For example, the square of 7 is 7 × 7 = 49. Later, I will teach you a simple method that will enable you to easily calculate the square of any two-digit or three-digit (or higher) number. That method is especially simple when the number ends in 5, so let's do that trick now.

To square a two-digit number that ends in 5, you need to remember only two things.

1. The answer begins by multiplying the first digit by the next higher digit.
2. The answer ends in 25.

For example, to square the number 35, we simply multiply the first digit (3) by the next higher digit (4), then attach 25. Since 3 × 4 = 12, the answer is 1225. Therefore, 35 × 35 = 1225. Our steps can be illustrated this way:

<div style="text-align: center; margin: 20px 0; font-family: Georgia, serif;">
  <div>35</div>
  <div>× 35</div>
  <div style="border-top: 1px solid #000; width: 50px; margin: 5px auto;"></div>
  <div>3 × 4 = 12</div>
  <div>5 × 5 = 25</div>
  <div style="border-top: 1px solid #000; width: 50px; margin: 5px auto;"></div>
  <div><strong>Answer: 1225</strong></div>
</div>

How about the square of 85? Since 8 × 9 = 72, we immediately get 85 × 85 = 7225.

<div style="text-align: center; margin: 20px 0; font-family: Georgia, serif;">
  <div>85</div>
  <div>× 85</div>
  <div style="border-top: 1px solid #000; width: 50px; margin: 5px auto;"></div>
  <div>8 × 9 = 72</div>
  <div>5 × 5 = 25</div>
  <div style="border-top: 1px solid #000; width: 50px; margin: 5px auto;"></div>
  <div><strong>Answer: 7225</strong></div>
</div>

We can use a similar trick when multiplying two-digit numbers with the same first digit, and second digits that sum to 10. The answer begins the same way that it did before (the first digit multiplied by the next higher digit), followed by the product of the second digits. For example, let's try 83 × 87. (Both numbers begin with 8, and the last digits sum to 3 + 7 = 10.) Since 8 × 9 = 72, and 3 × 7 = 21, the answer is 7221.

<div style="text-align: center; margin: 20px 0; font-family: Georgia, serif;">
  <div>83</div>
  <div>× 87</div>
  <div style="border-top: 1px solid #000; width: 50px; margin: 5px auto;"></div>
  <div>8 × 9 = 72</div>
  <div>3 × 7 = 21</div>
  <div style="border-top: 1px solid #000; width: 50px; margin: 5px auto;"></div>
  <div><strong>Answer: 7221</strong></div>
</div>

Similarly, 84 × 86 = 7224.
Now it's your turn. Try

26 × 24

How does the answer begin? With 2 × 3 = 6. How does it end? With 6 × 4 = 24. Thus 26 × 24 = 624.
Remember that to use this method, the first digits have to be the same, and the last digits must sum to 10. Thus, we can use this method to instantly determine that

<div style="margin: 15px 0; font-family: Georgia, serif;">
  <div>31 × 39 = 1209</div>
  <div>32 × 38 = 1216</div>
  <div>33 × 37 = 1221</div>
  <div>34 × 36 = 1224</div>
  <div>35 × 35 = 1225</div>
</div>

You may ask,

"What if the last digits do not sum to ten? Can we use this method to multiply twenty-two and twenty-three?"

Well, not yet. But in Chapter 8, I will show you an easy way to do problems like this using the close-together method. (For 22 × 23, you would do 20 × 25 plus 2 × 3, to get 500 + 6 = 506, but I'm getting ahead of myself!) Not only will you learn how to use these methods, but you will understand why these methods work, too.`
    },
    {
      id: "mental-addition-subtraction",
      title: "Mental Addition and Subtraction",
      content: `"Are there any tricks for doing mental addition and subtraction?"

Definitely, and that is what the next chapter is all about. If I were forced to summarize my method in three words, I would say, "Left to right." Here is a sneak preview.

Consider the subtraction problem

1241
− 587

Most people would not like to do this problem in their head (or even on paper!), but let's simplify it. Instead of subtracting 587, subtract 600. Since 1200 − 600 = 600, we have that

1241
− 600
  641

But we have subtracted 13 too much. (We will explain how to quickly determine the 13 in Chapter 1.) Thus, our painful-looking subtraction problem becomes the easy addition problem

641
+ 13
654

which is not too hard to calculate in your head (especially from left to right). Thus, 1241 − 587 = 654.

Using a little bit of mathematical magic, described in Chapter 9, you will be able to instantly compute the sum of the ten numbers below.

9
5
14
19
33
52
85
137
222
+ 359
935

Although I won't reveal the magical secret right now, here is a hint. The answer, 935, has appeared elsewhere in this chapter. More tricks for doing math on paper will be found in Chapter 6. Furthermore, you will be able to quickly give the quotient of the last two numbers:

359 ÷ 222 = 1.61 (first three digits)

We will have much more to say about division (including decimals and fractions) in Chapter 4.`
    },
    {
      id: "practical-tips",
      title: "More Practical Tips",
      content: `Here's a quick tip for calculating tips. Suppose your bill at a restaurant came to $42, and you wanted to leave a 15% tip. First we calculate 10% of $42, which is $4.20. If we cut that number in half, we get $2.10, which is 5% of the bill. Adding these numbers together gives us $6.30, which is exactly 15% of the bill. We will discuss strategies for calculating sales tax, discounts, compound interest, and other practical items in Chapter 5, along with strategies that you can use for quick mental estimation when an exact answer is not required.`
    },
    {
      id: "improve-your-memory",
      title: "Improve Your Memory",
      content: `In Chapter 7, you will learn a useful technique for memorizing numbers. This will be handy in and out of the classroom. Using an easy-to-learn system for turning numbers into words, you will be able to quickly and easily memorize any numbers: dates, phone numbers, whatever you want.

Speaking of dates, how would you like to be able to figure out the day of the week of any date? You can use this to figure out birth dates, historical dates, future appointments, and so on. I will show you this in more detail later, but here is a simple way to figure out the day of January 1 for any year in the twenty-first century. First familiarize yourself with the following table.

Monday    Tuesday    Wednesday    Thursday    Friday    Saturday    Sunday
   1          2           3           4          5          6        7 or 0

For instance, let's determine the day of the week of January 1, 2030. Take the last two digits of the year, and consider it to be your bill at a restaurant. (In this case, your bill would be $30.) Now add a 25% tip, but keep the change. (You can compute this by cutting the bill in half twice, and ignoring any change. Half of $30 is $15. Then half of $15 is $7.50. Keeping the change results in a $7 tip.) Hence your bill plus tip amounts to $37. To figure out the day of the week, subtract the biggest multiple of 7 (0, 7, 14, 21, 28, 35, 42, 49, . . .) from your total, and that will tell you the day of the week. In this case, 37 − 35 = 2, and so January 1, 2030, will occur on 2's day, namely Tuesday:

Bill:         30
Tip:        +  7
            37
subtract 7s: − 35
            2 = Tuesday

How about January 1, 2043:

Bill:         43
Tip:        + 10
            53
subtract 7s: − 49
            4 = Thursday

Exception: If the year is a leap year, remove $1 from your tip, then proceed as before. For example, for January 1, 2032, a 25% tip of $32 would be $8. Removing one dollar gives a total of 32 + 7 = 39. Subtracting the largest multiple of 7 gives us 39 − 35 = 4. So January 1, 2032, will be on 4's day, namely Thursday. For more details that will allow you to compute the day of the week of any date in history, see Chapter 9. (In fact, it's perfectly okay to read that chapter first!)

I know what you are wondering now:

"Why didn't they teach this to us in school?"

I'm afraid that there are some questions that even I cannot answer. Are you ready to learn more magical math? Well, what are we waiting for? Let's go!`
    }
  ],
  exercises: {
    types: [
      {
        id: "multiply-by-11",
        title: "Multiply by 11",
        description: "Practice multiplying two-digit numbers by 11 mentally.",
        difficulty: ["easy", "medium", "hard"]
      },
      {
        id: "squaring",
        title: "Squaring Numbers Ending in 5",
        description: "Practice squaring numbers that end in 5 using the quick method.",
        difficulty: ["easy", "medium", "hard"]
      },
      {
        id: "special-multiplication",
        title: "Special Multiplication",
        description: "Practice multiplying two-digit numbers with the same first digit and second digits that sum to 10.",
        difficulty: ["easy", "medium", "hard"]
      }
    ]
  }
}; 