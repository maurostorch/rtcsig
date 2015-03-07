from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView

urlpatterns = patterns('',
	url(r'offer/', 'rtcsig.views.offer', name='offer'),
	url(r'answer/', 'rtcsig.views.answer', name='answer'),
	url(r'candidate/', 'rtcsig.views.candidate', name='candidate'),
)
