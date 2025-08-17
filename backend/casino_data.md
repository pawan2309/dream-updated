# CASINO TABLES - API DATA COLLECTION

## Overview
This file contains the collected data from all casino game endpoints with proper headers, links, and game information.

---

## 1ST GAME: TEEN PATTI (teen20)
**Streaming ID:** 3030

### API Endpoints:
- **Data/Last 10 Results:** `http://159.65.20.25:3000/getdata/teen20`
- **Results:** `http://159.65.20.25:3000/getresult/teen20`
- **Detail Result:** `http://159.65.20.25:3000/getdetailresult/<roundid>`

### Current Game Data:
```json
{
  "success": true,
  "data": {
    "t1": [
      {
        "mid": "102250815181556",
        "autotime": 0,
        "remark": "",
        "gtype": "teen20",
        "min": 100,
        "max": 300000,
        "C1": "KDD",
        "C2": "9HH",
        "C3": "2SS",
        "C4": "AHH",
        "C5": "8HH",
        "C6": "1"
      }
    ],
    "t2": [
      {
        "mid": "102250815181556",
        "nation": "Player A",
        "sid": "1",
        "rate": "0",
        "gstatus": "0",
        "min": 100,
        "max": 500000
      },
      {
        "mid": "102250815181556",
        "nation": "Pair plus A",
        "sid": "2",
        "rate": "0",
        "gstatus": "0",
        "min": 100,
        "max": 25000
      },
      {
        "mid": "102250815181556",
        "nation": "Player B",
        "sid": "3",
        "rate": "0",
        "gstatus": "0",
        "min": 100,
        "max": 500000
      },
      {
        "mid": "102250815181556",
        "nation": "Pair plus B",
        "sid": "4",
        "rate": "0",
        "gstatus": "0",
        "min": 100,
        "max": 25000
      }
    ]
  }
}
```

### Last 10 Results:
```json
{
  "success": true,
  "data": [
    {"result": "3", "mid": "102250815181556"},
    {"result": "3", "mid": "102250815181501"},
    {"result": "1", "mid": "102250815181407"},
    {"result": "3", "mid": "102250815181311"},
    {"result": "1", "mid": "102250815181216"},
    {"result": "1", "mid": "102250815181116"},
    {"result": "1", "mid": "102250815181023"},
    {"result": "1", "mid": "102250815180927"},
    {"result": "1", "mid": "102250815180830"},
    {"result": "1", "mid": "102250815180734"}
  ]
}
```

---

## 2ND GAME: ANDAR BAHAR (ab20)
**Streaming ID:** 3043

### API Endpoints:
- **Data/Last 10 Results:** `http://159.65.20.25:3000/getdata/ab20`
- **Results:** `http://159.65.20.25:3000/getresult/ab20`
- **Detail Result:** `http://159.65.20.25:3000/getdetailresult/<roundid>`

### Current Game Data:
```json
{
  "success": true,
  "data": {
    "t1": [
      {
        "mid": "123250815181703",
        "autotime": "30",
        "remark": "Payout : Bahar 1st Card 25% and All Other Andar-Bahar Cards 100%.",
        "gtype": "ab20",
        "min": 100,
        "max": 300000
      }
    ],
    "t2": [
      {
        "mid": "123250815181703",
        "nation": "Ander A",
        "sid": "1",
        "rate": "2",
        "gstatus": "1",
        "min": 10,
        "max": 10000
      }
      // ... Additional betting options for all cards A-K for both Andar and Bahar
    ]
  }
}
```

### Last 10 Results:
```json
{
  "success": true,
  "data": [
    {"result": "0", "mid": "123250815181251"},
    {"result": "0", "mid": "123250815180906"},
    {"result": "0", "mid": "123250815180432"},
    {"result": "0", "mid": "123250815175913"},
    {"result": "0", "mid": "123250815175537"},
    {"result": "0", "mid": "123250815175058"},
    {"result": "0", "mid": "123250815174541"},
    {"result": "0", "mid": "123250815174056"},
    {"result": "0", "mid": "123250815173659"},
    {"result": "0", "mid": "123250815173305"}
  ]
}
```

---

## 3RD GAME: DRAGON TIGER (dt20)
**Streaming ID:** 3035

### API Endpoints:
- **Data/Last 10 Results:** `http://159.65.20.25:3000/getdata/dt20`
- **Results:** `http://159.65.20.25:3000/getresult/dt20`
- **Detail Result:** `http://159.65.20.25:3000/getdetailresult/<roundid>`

### Current Game Data:
```json
{
  "success": true,
  "data": {
    "t1": [
      {
        "mid": "116250815181647",
        "autotime": "0",
        "gtype": "dt20",
        "min": 100,
        "max": 300000,
        "C1": "1",
        "C2": "1"
      }
    ],
    "t2": [
      {
        "mid": "116250815181647",
        "nat": "Dragon",
        "sid": "1",
        "rate": "0",
        "gstatus": "0",
        "min": 100,
        "max": 300000
      }
      // ... Additional betting options including Tie, Pair, Even/Odd, Red/Black, and specific card bets
    ]
  }
}
```

### Last 10 Results:
```json
{
  "success": true,
  "data": [
    {"result": "2", "mid": "116250815181529"},
    {"result": "2", "mid": "116250815181436"},
    {"result": "2", "mid": "116250815181350"},
    {"result": "2", "mid": "116250815181305"},
    {"result": "1", "mid": "116250815181220"},
    {"result": "2", "mid": "116250815181134"},
    {"result": "1", "mid": "116250815181049"},
    {"result": "1", "mid": "116250815181002"},
    {"result": "2", "mid": "116250815180919"},
    {"result": "1", "mid": "116250815180836"}
  ]
}
```

---

## 4TH GAME: AAA (aaa)
**Streaming ID:** 3056

### API Endpoints:
- **Data/Last 10 Results:** `http://159.65.20.25:3000/getdata/aaa`
- **Results:** `http://159.65.20.25:3000/getresult/aaa`
- **Detail Result:** `http://159.65.20.25:3000/getdetailresult/<roundid>`

### Current Game Data:
```json
{
  "success": true,
  "data": {
    "t1": [
      {
        "mid": "121250815181656",
        "autotime": "10",
        "C1": "1",
        "remark": ""
      }
    ],
    "t2": [
      {
        "mid": "121250815181656",
        "sid": "1",
        "nat": "Amar",
        "b1": "2.12",
        "l1": "2.22",
        "gtype": "aaa",
        "gstatus": "ACTIVE",
        "min": 100,
        "max": 300000
      }
      // ... Additional betting options including Akbar, Anthony, Even/Odd, Red/Black, specific cards, and Under/Over 7
    ]
  }
}
```

### Last 10 Results:
```json
{
  "success": true,
  "data": [
    {"result": "3", "mid": "121250815181607"},
    {"result": "3", "mid": "121250815181517"},
    {"result": "2", "mid": "121250815181430"},
    {"result": "2", "mid": "121250815181322"},
    {"result": "3", "mid": "121250815181214"},
    {"result": "2", "mid": "121250815181112"},
    {"result": "1", "mid": "121250815181012"},
    {"result": "1", "mid": "121250815180910"},
    {"result": "1", "mid": "121250815180811"},
    {"result": "2", "mid": "121250815180710"}
  ]
}
```

---

## 5TH GAME: 32 CARD EUROPEAN (card32eu)
**Streaming ID:** 3034

### API Endpoints:
- **Data/Last 10 Results:** `http://159.65.20.25:3000/getdata/card32eu`
- **Results:** `http://159.65.20.25:3000/getresult/card32eu`
- **Detail Result:** `http://159.65.20.25:3000/getdetailresult/<roundid>`

### Current Game Data:
```json
{
  "success": true,
  "data": {
    "t1": [
      {
        "mid": "114250815181710",
        "autotime": "14",
        "gtype": "card32eu",
        "min": 100,
        "max": 300000,
        "C1": "0",
        "C2": "0",
        "C3": "0",
        "C4": "0",
        "remark": "",
        "desc": "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1"
      }
    ],
    "t2": [
      {
        "mid": "114250815181710",
        "sid": "1",
        "nation": "Player 8",
        "b1": "12.2",
        "bs1": "150000",
        "l1": "13.7",
        "ls1": "150000",
        "gstatus": "ACTIVE",
        "gtype": "card32eu",
        "min": 100,
        "max": 100000
      }
      // ... Additional betting options including Players 9-11, Even/Odd variants, color bets, specific cards, and combination bets
    ]
  }
}
```

### Last 10 Results:
```json
{
  "success": true,
  "data": [
    {"result": "3", "mid": "114250815181558"},
    {"result": "1", "mid": "114250815181444"},
    {"result": "2", "mid": "114250815181335"},
    {"result": "3", "mid": "114250815181139"},
    {"result": "3", "mid": "114250815181033"},
    {"result": "1", "mid": "114250815180928"},
    {"result": "1", "mid": "114250815180735"},
    {"result": "4", "mid": "114250815180626"},
    {"result": "4", "mid": "114250815180432"},
    {"result": "4", "mid": "114250815180326"}
  ]
}
```

---

## 6TH GAME: LUCKY 7 EUROPEAN (lucky7eu)
**Streaming ID:** 3032

### API Endpoints:
- **Data/Last 10 Results:** `http://159.65.20.25:3000/getdata/lucky7eu`
- **Results:** `http://159.65.20.25:3000/getresult/lucky7eu`
- **Detail Result:** `http://159.65.20.25:3000/getdetailresult/<roundid>`

### Current Game Data:
```json
{
  "success": true,
  "data": {
    "t1": [
      {
        "mid": "107250815181727",
        "autotime": "7",
        "gtype": "lucky7eu",
        "min": 100,
        "max": 100000,
        "C1": "1"
      }
    ],
    "t2": [
      {
        "mid": "107250815181727",
        "nat": "LOW Card",
        "sid": "1",
        "rate": "2",
        "gstatus": "1",
        "min": 100,
        "max": 100000
      }
      // ... Additional betting options including HIGH Card, Even/Odd, Red/Black, specific cards 1-K, and Line bets 1-4
    ]
  }
}
```

### Last 10 Results:
```json
{
  "success": true,
  "data": [
    {"result": "1", "mid": "107250815181651"},
    {"result": "2", "mid": "107250815181614"},
    {"result": "2", "mid": "107250815181458"},
    {"result": "2", "mid": "107250815181420"},
    {"result": "1", "mid": "107250815181340"},
    {"result": "1", "mid": "107250815181302"},
    {"result": "2", "mid": "107250815181225"},
    {"result": "1", "mid": "107250815181150"},
    {"result": "2", "mid": "107250815181113"},
    {"result": "1", "mid": "107250815181037"}
  ]
}
```

---

## Summary
- **Total Games:** 6
- **Base URL:** `http://159.65.20.25:3000`
- **Streaming IDs:** 3030, 3043, 3035, 3056, 3034, 3032
- **Game Types:** teen20, ab20, dt20, aaa, card32eu, lucky7eu
- **Data Collected:** Current game data and last 10 results for each game
- **Note:** Streaming links will be provided after payment

---
*Data collected on: $(Get-Date)*
*Source: Casino API endpoints*


