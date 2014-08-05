from django.shortcuts import render, HttpResponse
from django.views.decorators.csrf import csrf_protect,ensure_csrf_cookie
from django.core import serializers
import hashlib
import tempfile
import os

# Create your views here.
def offer(request):
	if request.user.is_authenticated():
		user = str(hashlib.md5(request.user.username).hexdigest())
		d=str(tempfile.gettempdir())+'/'+user+'/offers/'
		try: os.makedirs(d)
		except: pass
		if request.POST.get('offerdesc'):
			filename = str(hashlib.md5(request.POST.get('offerdesc')).hexdigest())
			f = open(d+filename,'w')
			f.write(request.POST.get('offerdesc'))
			f.close()
			return HttpResponse(status=200)
		elif request.GET.get('offerdesc'):
			# this could be a conctenated list of offers
			iam = str(request.GET.get('offerdesc'))
			offers = '['
			try:
				for fn in os.listdir(d):
					f = open(d+fn,'r')
					t = f.read()
					print t
					try:
						iam.index(t)
						f.close()
						continue
					except:
						pass
					offers = offers+t+','
					f.close()
					os.remove(d+fn)
			except IOError as e:
				print e
			offers = offers+']'
			offers = offers.replace(',]',']')
			#data = serializers.serialize('json',offers)
			return HttpResponse(offers, content_type='application/json')
		return HttpResponse(status=404)
	return HttpResponse(status=403)

def answer(request):
	if request.user.is_authenticated():
		user = str(hashlib.md5(request.user.username).hexdigest())
		d=str(tempfile.gettempdir())+'/'+user+'/answers/'
		try: os.makedirs(d)
		except: pass
		if request.POST.get('answers'):
			subdir = str(hashlib.md5(request.POST.get('desc')).hexdigest())+'/'
			print 'answer POST call ',subdir
			try: os.mkdir(d+subdir)
			except: pass
			filename = str(hashlib.md5(request.POST.get('answers')).hexdigest())
			f = open(d+subdir+filename,'w')
			f.write(request.POST.get('answers'))
			f.close()
			return HttpResponse(status=200)
		elif request.GET.get('desc'):
			subdir = str(hashlib.md5(request.GET.get('desc')).hexdigest())+'/'
			print 'answer GET call ',subdir
			answers = ''
			try:
				for fn in os.listdir(d+subdir):
					f = open(d+subdir+fn,'r')
					t = f.read()
					answers = t
					f.close()
					os.remove(d+subdir+fn)
			except (IOError, OSError) as e:
				pass
			#data = serializers.serialize('json',answers)
			answers = answers == '' and '[]' or '['+answers+']'
			return HttpResponse(answers, content_type='application/json')
		return HttpResponse(status=404)
	return HttpResponse(status=403)

def candidate(request):
	if request.user.is_authenticated():
		user = str(hashlib.md5(request.user.username).hexdigest())
		d=str(tempfile.gettempdir())+'/'+user+'/candidates/'
		try: os.makedirs(d)
		except: pass
		if request.POST.get('candidate'):
			subdir = str(hashlib.md5(request.POST.get('desc')).hexdigest())+'/'
			try: os.mkdir(d+subdir)
			except: pass
			filename = str(hashlib.md5(request.POST.get('candidate')).hexdigest())
			f = open(d+subdir+filename,'w')
			f.write(request.POST.get('candidate'))
			f.close()
			return HttpResponse(status=200)
		elif request.GET.get('desc'):
			subdir = str(hashlib.md5(request.GET.get('desc')).hexdigest())+'/'
			candidates = '['
			try:
				for fn in os.listdir(d+subdir):
					f = open(d+subdir+fn,'r')
					t = f.read()
					candidates = candidates+t+','
					f.close()
					os.remove(d+subdir+fn)
			except (IOError, OSError) as e:
				pass
			candidates = candidates+']'
			candidates = candidates.replace(',]',']')
			#data = serializers.serialize('json',candidates)
			return HttpResponse(candidates, content_type='application/json')
		return HttpResponse(status=404)
	return HttpResponse(status=403)