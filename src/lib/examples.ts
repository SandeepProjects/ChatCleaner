export interface ExampleChat {
  name: string;
  platform: string;
  icon: string;
  rawText: string;
}

export const EXAMPLES: ExampleChat[] = [
  {
    name: 'ChatGPT',
    platform: 'ChatGPT',
    icon: 'sparkles',
    rawText: `You
Explain the difference between a stack and a queue to a 5-year-old.

ChatGPT
Think of a stack like a tower of toy blocks or a stack of pancakes. 
You can only add a block on the very top, and you can only take a block off from the top. If you want to get the block at the bottom, you have to take all the top blocks off first! In computer science, we call this LIFO: Last-In, First-Out.

Now, think of a queue like a line of kids waiting to go down a slide at the park. 
The first kid who gets in line is the first one who gets to slide down. If a new kid comes, they have to go to the very back of the line and wait their turn. In computer science, we call this FIFO: First-In, First-Out.

Copy
Regenerate
Share`
  },
  {
    name: 'Claude',
    platform: 'Claude',
    icon: 'bot',
    rawText: `User: Can you write a basic quicksort function in Python?

Claude:
Certainly! Here is a simple implementation of the Quicksort algorithm in Python. It uses list comprehensions for clarity:

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# Test the quicksort
test_list = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(test_list))
# Output: [1, 1, 2, 3, 6, 8, 10]
\`\`\`

Is there anything else you need help with?
Copy Code
Was this response helpful? Yes / No`
  },
  {
    name: 'Perplexity',
    platform: 'Perplexity',
    icon: 'search',
    rawText: `You
Who discovered penicillin and when?

Perplexity
Searched 4 sources
Penicillin was discovered by the Scottish physician and microbiologist Alexander Fleming in September 1928 [1]. 

While working at St. Mary's Hospital in London, Fleming returned from a vacation to find that a green mold called *Penicillium notatum* had contaminated one of his Petri dishes containing *Staphylococcus* bacteria. He observed that the bacteria immediately surrounding the mold had been destroyed, leading to the discovery of the world's first effective antibiotic [2].

Sources
[1] Alexander Fleming Discovery: https://www.history.com/topics/inventions/penicillin
[2] Penicillin History: https://www.acs.org/education/whatischemistry/landmarks/flemingpenicillin.html

Copy
Share
Rewrite
`
  },
  {
    name: 'Grok',
    platform: 'Grok',
    icon: 'brain',
    rawText: `You
Is Pluto a planet?

Grok
No, Pluto is no longer classified as a major planet. 

In 2006, the International Astronomical Union (IAU) defined a "planet" as a celestial body that:
1. Is in orbit around the Sun.
2. Has sufficient mass for its self-gravity to overcome rigid body forces so that it assumes a nearly round shape.
3. Has "cleared the neighborhood" around its orbit.

Pluto failed to meet the third criterion because its orbit is cluttered with other Kuiper Belt objects. Therefore, it was reclassified as a "dwarf planet".

Grok 2.0 (Beta)
Copy
Share`
  }
];
