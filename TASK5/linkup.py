import tkinter as tk
from tkinter import messagebox
import qrcode
import cv2
import sqlite3
import os
import uuid
from pyzbar.pyzbar import decode
from PIL import Image, ImageTk

class FriendApp:
    def __init__(self, window):
        self.window = window
        self.window.title("QR Friend Connector")
        self.window.geometry("400x600")
        
        self.db = "data.db"
        self.id_file = "my_id.txt"
        self.my_id = self.load_id()
        
        self.start_db()
        self.ui()
        self.update_list()

    def load_id(self):
        if os.path.exists(self.id_file):
            with open(self.id_file, "r") as f:
                return f.read().strip()
        else:
            uid = str(uuid.uuid4())[:8]
            with open(self.id_file, "w") as f:
                f.write(uid)
            return uid

    def start_db(self):
        conn = sqlite3.connect(self.db)
        conn.execute("CREATE TABLE IF NOT EXISTS friends (uid TEXT UNIQUE)")
        conn.commit()
        conn.close()

    def ui(self):
        tk.Label(self.window, text="My Connection QR", font=("Arial", 12, "bold")).pack(pady=10)
        
        self.qr_box = tk.Label(self.window, bg="white", width=200, height=200)
        self.qr_box.pack(pady=5)
        
        img = qrcode.make(self.my_id).resize((200, 200))
        self.photo = ImageTk.PhotoImage(img)
        self.qr_box.config(image=self.photo)

        tk.Label(self.window, text=f"My ID: {self.my_id}").pack()

        tk.Button(self.window, text="Scan a Friend", font=("Arial", 12), height=2, width=20, command=self.scan).pack(pady=20)

        f_frame = tk.Frame(self.window)
        f_frame.pack(fill="x", padx=20)
        tk.Label(f_frame, text="Connected Friends:").pack(side="left")
        tk.Button(f_frame, text="Clear", command=self.clear_all).pack(side="right")

        self.listbox = tk.Listbox(self.window, height=10)
        self.listbox.pack(fill="x", padx=20, pady=5)

    def scan(self):
        cap = cv2.VideoCapture(0)
        while True:
            ret, frame = cap.read()
            if not ret: break

            for obj in decode(frame):
                found_id = obj.data.decode("utf-8")
                if found_id == self.my_id:
                    messagebox.showinfo("Wait", "That's your own code!")
                else:
                    self.save_friend(found_id)
                cap.release()
                cv2.destroyAllWindows()
                return

            cv2.imshow("Scanner - Press Q to cancel", frame)
            if cv2.waitKey(1) & 0xFF == ord('q') or cv2.getWindowProperty("Scanner - Press Q to cancel", cv2.WND_PROP_VISIBLE) < 1:
                break

        cap.release()
        cv2.destroyAllWindows()

    def save_friend(self, fid):
        try:
            conn = sqlite3.connect(self.db)
            conn.execute("INSERT INTO friends VALUES (?)", (fid,))
            conn.commit()
            conn.close()
            self.update_list()
        except:
            messagebox.showinfo("Note", "Already added!")

    def clear_all(self):
        if messagebox.askyesno("Confirm", "Delete list?"):
            conn = sqlite3.connect(self.db)
            conn.execute("DELETE FROM friends")
            conn.commit()
            conn.close()
            self.update_list()

    def update_list(self):
        self.listbox.delete(0, tk.END)
        conn = sqlite3.connect(self.db)
        for row in conn.execute("SELECT uid FROM friends"):
            self.listbox.insert(tk.END, f" Friend: {row[0]}")
        conn.close()

if __name__ == "__main__":
    root = tk.Tk()
    app = FriendApp(root)
    root.mainloop()