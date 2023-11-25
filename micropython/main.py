import machine
import utime
import requests
import network
import ujson

pir_sensor = machine.Pin(14, machine.Pin.IN)
led = machine.Pin(15, machine.Pin.OUT)
ssid = 'Dam-is-a-beaver-word'
password = 'Wifi4beavers'

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid,password)
print(wlan.isconnected())

global timer_delay
timer_delay = utime.ticks_ms()
print("start")

def pir_in_high_level(pin):
    global timer_delay
    pir_sensor.irq(trigger=machine.Pin.IRQ_FALLING, handler=pir_in_low_level)
    intervals = utime.ticks_diff(utime.ticks_ms(), timer_delay)
    timer_delay = utime.ticks_ms()
    led.value(1)
    payload = {'phoneBooth': '1', 'occupied': 'true'}
    data=ujson.dumps(payload)
    r = requests.post('https://dashboard-tdxjrfho.fermyon.app/api', data=data)
    print(r.text)
    print("the dormancy duration is " + str(intervals) + "ms")

def pir_in_low_level(pin):
    global timer_delay
    pir_sensor.irq(trigger=machine.Pin.IRQ_RISING, handler=pir_in_high_level)
    intervals2 = utime.ticks_diff(utime.ticks_ms(), timer_delay)
    timer_delay = utime.ticks_ms()
    led.value(0)
    payload = {'phoneBooth': '1', 'occupied': 'false'}
    data=ujson.dumps(payload)
    r = requests.post('https://dashboard-tdxjrfho.fermyon.app/api', data=data)
    print(r.text)
    print("the duration of work is " + str(intervals2) + "ms")

pir_sensor.irq(trigger=machine.Pin.IRQ_RISING, handler=pir_in_high_level)


