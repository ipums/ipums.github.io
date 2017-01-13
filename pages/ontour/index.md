---
layout: page
status: publish
published: true
title: MPC IT On Tour
author: mpcit
permalink: /ontour/
show_meta: false
comments: false
---

A partial list of industry events at which MPC IT staff have attended or presented.

{% for event in site.data.ontour %}
<div class="ontouritem">
<h5 class="font-size-small">{{ event.date }}</h5>
{{ event.title }} ({{ event.location }})<br />
HELLO
{% if event.who != '' %}NEW{{ event.who }}<br />{% endif %}
<em>{{ event.text }}</em><br />
</div>
{% endfor %}
