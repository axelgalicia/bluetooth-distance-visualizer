## Bluetooth Distance Meter

This simple web app can approximate devices distances using Bluetooth RSSI information.

A diagram is displayed in real-time showing the devices found distributed in a circle for easy view.

### Displaying devices with name
![Screenshot one](https://github.com/axelgalicia/bluetooth-distance/blob/master/img/screen-2.png)

### Displaying without name
![Screenshot one](https://github.com/axelgalicia/bluetooth-distance/blob/master/img/screen-1.png)

### How to start it

1) Install dependencies
```
npm install
```

2) Run Server
```
node index.js
```

3) Open index.js using a Web server or VS Code (Go Live Feature)


## Description

The server listen for Bluetooth devices and has a tick frame of 1 sec to send the information to every Web Socket client where the client show the information.




## Libraries Used

- https://github.com/noble/noble
- Web Socket
- D3.js
- ChatGPT


@author: Axel Galicia

@date: March 2024