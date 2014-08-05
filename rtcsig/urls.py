from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView

urlpatterns = patterns('',
	url(r'offer/', 'copiarcolar.apps.rtcsig.views.offer', name='offer'),
	url(r'answer/', 'copiarcolar.apps.rtcsig.views.answer', name='answer'),
	url(r'candidate/', 'copiarcolar.apps.rtcsig.views.candidate', name='candidate'),
)
