import random

with open('shirts.csv', 'w') as f:
    for i in range(0,9):
        for j in range(0,4):
            for k in range(0,10):
                ShirtID = i * 10000 + j * 100 + k
                count = random.randint(1, 1000)
                f.write(f'{ShirtID},{count}\n')