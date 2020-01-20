#!/usr/bin/env python

fin = open("game.min.raw.js", "rt")
fout = open("game.min.js", "wt")

for line in fin:
	fout.write(line.replace('const e=t.clientX-d,n=t.clientY-l;e=e,n=n,', 'const e=t.clientX-d,n=t.clientY-l;'))

fin.close()
fout.close()
