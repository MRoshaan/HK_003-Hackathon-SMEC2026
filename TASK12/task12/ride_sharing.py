import tkinter as tk
from tkinter import messagebox
import datetime
import webbrowser

class Ride:
    def __init__(self, driver, start, end, time, seats):
        self.driver = driver
        self.start = start
        self.end = end
        self.time = time
        self.total_seats = seats
        self.available_seats = seats
        self.booked_by = []

class App:
    def __init__(self, root):
        self.root = root
        self.rides = []
        self.current_user = "User1"
        self.root.title("University Ride-Sharing App")
        
        self.post_button = tk.Button(root, text="Post Ride", command=self.post_ride)
        self.post_button.pack(pady=10)
        
        self.search_button = tk.Button(root, text="Search and Book Ride", command=self.search_ride)
        self.search_button.pack(pady=10)
        
        self.history_button = tk.Button(root, text="View Ride History", command=self.view_history)
        self.history_button.pack(pady=10)

    def post_ride(self):
        post_win = tk.Toplevel(self.root)
        post_win.title("Post a Ride")
        
        tk.Label(post_win, text="Start Location:").pack()
        start_entry = tk.Entry(post_win)
        start_entry.pack()
        
        tk.Label(post_win, text="End Location:").pack()
        end_entry = tk.Entry(post_win)
        end_entry.pack()
        
        tk.Label(post_win, text="Time (HH:MM):").pack()
        time_entry = tk.Entry(post_win)
        time_entry.pack()
        
        tk.Label(post_win, text="Available Seats:").pack()
        seats_entry = tk.Entry(post_win)
        seats_entry.pack()
        
        def submit():
            try:
                start = start_entry.get()
                end = end_entry.get()
                time_str = time_entry.get()
                seats = int(seats_entry.get())
                time = datetime.datetime.strptime(time_str, "%H:%M").time()
                ride = Ride(self.current_user, start, end, time, seats)
                self.rides.append(ride)
                messagebox.showinfo("Success", "Ride posted successfully!")
                post_win.destroy()
            except ValueError:
                messagebox.showerror("Error", "Invalid input. Please check time format (HH:MM) and seats (integer).")
        
        tk.Button(post_win, text="Submit", command=submit).pack(pady=10)

    def search_ride(self):
        search_win = tk.Toplevel(self.root)
        search_win.title("Search and Book Rides")
        
        tk.Label(search_win, text="Start Location:").pack()
        start_entry = tk.Entry(search_win)
        start_entry.pack()
        
        tk.Label(search_win, text="End Location:").pack()
        end_entry = tk.Entry(search_win)
        end_entry.pack()
        
        tk.Label(search_win, text="Time (HH:MM):").pack()
        time_entry = tk.Entry(search_win)
        time_entry.pack()
        
        results_list = tk.Listbox(search_win, width=50)
        results_list.pack(pady=10)
        
        def search():
            results_list.delete(0, tk.END)
            start = start_entry.get()
            end = end_entry.get()
            time_str = time_entry.get()
            try:
                time = datetime.datetime.strptime(time_str, "%H:%M").time()
                count = 0
                for ride in self.rides:
                    if (ride.start.lower() == start.lower() and 
                        ride.end.lower() == end.lower() and 
                        ride.time == time and 
                        ride.available_seats > 0):
                        results_list.insert(tk.END, f"Driver: {ride.driver}, Available Seats: {ride.available_seats}")
                        count += 1
                if count == 0:
                    results_list.insert(tk.END, "No rides found matching criteria.")
            except ValueError:
                messagebox.showerror("Error", "Invalid time format. Use HH:MM.")
        
        tk.Button(search_win, text="Search", command=search).pack()
        
        def book():
            selected = results_list.curselection()
            if not selected:
                messagebox.showwarning("Warning", "Please select a ride to book.")
                return
            index = selected[0]
            start = start_entry.get()
            end = end_entry.get()
            time_str = time_entry.get()
            try:
                time = datetime.datetime.strptime(time_str, "%H:%M").time()
                count = 0
                for ride in self.rides:
                    if (ride.start.lower() == start.lower() and 
                        ride.end.lower() == end.lower() and 
                        ride.time == time and 
                        ride.available_seats > 0):
                        if count == index:
                            ride.available_seats -= 1
                            ride.booked_by.append(self.current_user)
                            messagebox.showinfo("Success", "Seat booked successfully!")
                            search()
                            break
                        count += 1
            except ValueError:
                messagebox.showerror("Error", "Invalid time format.")
        
        tk.Button(search_win, text="Book Selected Ride", command=book).pack(pady=5)
        
        def view_map():
            selected = results_list.curselection()
            if not selected:
                messagebox.showwarning("Warning", "Please select a ride to view map.")
                return
            index = selected[0]
            start = start_entry.get()
            end = end_entry.get()
            time_str = time_entry.get()
            try:
                time = datetime.datetime.strptime(time_str, "%H:%M").time()
                count = 0
                for ride in self.rides:
                    if (ride.start.lower() == start.lower() and 
                        ride.end.lower() == end.lower() and 
                        ride.time == time and 
                        ride.available_seats > 0):
                        if count == index:
                            url = f"https://www.google.com/maps/dir/{ride.start.replace(' ', '+')}/{ride.end.replace(' ', '+')}"
                            webbrowser.open(url)
                            break
                        count += 1
            except ValueError:
                messagebox.showerror("Error", "Invalid time format.")
        
        tk.Button(search_win, text="View Map for Selected Ride", command=view_map).pack(pady=5)

    def view_history(self):
        hist_win = tk.Toplevel(self.root)
        hist_win.title("Ride History")
        
        listbox = tk.Listbox(hist_win, width=60)
        listbox.pack(pady=10)
        
        for ride in self.rides:
            if self.current_user in ride.booked_by or ride.driver == self.current_user:
                status = "Driver" if ride.driver == self.current_user else "Passenger"
                listbox.insert(tk.END, f"{status}: {ride.start} to {ride.end} at {ride.time.strftime('%H:%M')}, Seats Booked: {ride.total_seats - ride.available_seats}/{ride.total_seats}")
        
        if listbox.size() == 0:
            listbox.insert(tk.END, "No ride history found.")

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()