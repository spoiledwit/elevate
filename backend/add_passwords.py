import csv
import random
import re

def generate_password_from_email(email):
    """Generate a password using words from email and random numbers"""
    # Extract username part (before @)
    username = email.split('@')[0]

    # Remove numbers and special characters, split by common separators
    words = re.split(r'[._\-0-9]+', username)
    words = [w for w in words if len(w) > 2]  # Keep words longer than 2 chars

    if not words:
        # Fallback if no valid words found
        words = [username[:6]]

    # Pick 1-2 random words
    num_words = min(random.randint(1, 2), len(words))
    selected_words = random.sample(words, num_words)

    # Capitalize first letter of each word
    password_words = ''.join(word.capitalize() for word in selected_words)

    # Add 2-4 random numbers
    num_digits = random.randint(2, 4)
    random_numbers = ''.join(str(random.randint(0, 9)) for _ in range(num_digits))

    # Combine
    password = password_words + random_numbers

    return password

def update_csv_with_passwords(input_file, output_file):
    """Read CSV, add password column, and write to output"""
    rows = []

    # Read existing CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames + ['Password']

        for row in reader:
            email = row['Email']
            password = generate_password_from_email(email)
            row['Password'] = password
            rows.append(row)

    # Write updated CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Updated {len(rows)} rows with passwords")
    print(f"Output written to: {output_file}")

if __name__ == "__main__":
    input_file = '/app/data1.csv'
    output_file = '/app/data1.csv'

    update_csv_with_passwords(input_file, output_file)
