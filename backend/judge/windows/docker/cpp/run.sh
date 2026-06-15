#!/bin/sh

g++ -std=c++17 main.cpp -O2 -o main

if [ $? -ne 0 ]
then
    exit 100
fi

./main